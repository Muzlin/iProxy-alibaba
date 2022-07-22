import React, { useState } from 'react';
// @ts-ignore
import { Extension } from '../../extension';
import { Checkbox, Card, Row, Col, Switch, Tooltip, Modal, message } from 'antd';
import './index.less';
import { envRuleOption } from './const';
import {
  generateInitRule,
  readEnableEnv,
  readProjects,
  readRules,
  readUtil,
  saveEnableEnv,
  saveProjects,
  saveRules,
  saveUtil,
} from './utils';
import http from 'http';
import {
  QuestionCircleOutlined,
  EditOutlined,
  PlusOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import EditDrawer from './edit';
import { useInterval } from 'ahooks';
import { Tray } from 'electron';
import * as remote from '@electron/remote';
import { CoreAPI } from '../../core-api';
import { ICON_TEMPLATE_PATH } from '../../const';

let tray: Tray;
let trayContextMenu;

async function buildTrayContextMenu() {
  const online = CoreAPI.store.get('onlineStatus') === 'online' ? true : false;

  trayContextMenu = remote.Menu.buildFromTemplate([
    {
      type: 'checkbox',
      label: '系统代理',
      checked: online,
      async click() {
        CoreAPI.eventEmmitter.emit('iproxy-toggle-system-proxy');
      },
    },
    { type: 'separator' },
    {
      label: '检查更新',
      click() {
        message.warning('功能正在开发中');
      },
    },
    { type: 'separator' },
    {
      label: '显示窗口',
      click() {
        remote.getCurrentWindow().show();
      },
    },
    {
      label: '退出应用',
      click() {
        remote.app.quit();
        remote.app.exit();
      },
    },
  ]);
  tray.setContextMenu(trayContextMenu);
}

export class WechatProxy extends Extension {
  constructor() {
    super('wechat-proxy');
    (async () => {
      const image = remote.nativeImage.createFromPath(ICON_TEMPLATE_PATH);
      tray = await new remote.Tray(image);

      tray.on('mouse-move', buildTrayContextMenu);
      tray.on('click', buildTrayContextMenu);
      tray.setToolTip('iProxy');
    })();
  }

  panelIcon() {
    return 'Wechat';
  }

  panelTitle() {
    return '企微代理';
  }

  panelComponent() {
    const WechatProxy = () => {
      generateInitRule();
      const [ruleList, setRuleList] = useState<any>(() => readRules());
      const [projectList, setProjectList] = useState<any>(() => readProjects());
      const [checkedList, setCheckedList] = useState<any>(() => readEnableEnv());
      const [checkedUtilList, setCheckedUtilList] = useState<any>(() => readUtil());

      // 检测本地服务是否启动&启动的环境信息
      const checkLocalServerEnv = (port: number, entry: string): any => {
        return new Promise((resolve) => {
          const httpRequest = http.get(`http://localhost:${port}/${entry}/env.js`, (res) => {
            if (res.statusCode === 404) {
              resolve({
                isRun: true,
              });
              return;
            }
            res.setEncoding('utf8');
            res.on('data', function (data) {
              resolve(
                resolve({
                  isRun: true,
                  env: JSON.parse(data.split('=')[1])?.VUE_APP_MKCONFIG_ENV,
                }),
              );
            });
          });
          httpRequest.on('error', (error) => {
            resolve({
              isRun: false,
            });
          });
        });
      };

      // 检测所有的项目配置 本地服务启动状态
      const checkLocalServer = async () => {
        const unresolved = projectList.map(async (i: any) => {
          const { isRun, env } = await checkLocalServerEnv(i.port, i.entry);
          i.isRun = isRun;
          i.env = env ?? '';
          return i;
        });
        const resolved = await Promise.all(unresolved);
        setProjectList(resolved?.sort((a: any, b: any) => (b?.isRun || false) - (a?.isRun || false)));
      };

      useInterval(() => {
        checkLocalServer();
      }, 5000);

      const changeRules = () => {
        const ruleKey = readEnableEnv();
        const utilKey = readUtil();
        saveRules(
          ruleList.map((item: any) => {
            item.enabled = [...ruleKey, ...utilKey].includes(item.name);
            return item;
          }),
        );
        setRuleList(ruleList);
      };
      // 开启、关闭某个环境的代理1
      const onChange = (e: any) => {
        saveEnableEnv(e);
        setCheckedList(e);
        changeRules();
      };
      const onUtilChange = (e: any) => {
        console.log('onUtilChange', e);
        setCheckedUtilList(e);
        saveUtil(e);
        changeRules();
      };

      const delProject = (project: any) => {
        Modal.confirm({
          title: `是否删除 ${project.name} 项目?`,
          icon: <ExclamationCircleOutlined />,
          content: '删除之后需要重新添加项目才能使用',
          okText: '确认',
          cancelText: '取消',
          onOk: () => {
            const newProjectList = projectList.filter((item: any) => item.name !== project.name);
            setProjectList(newProjectList);
            saveProjects(newProjectList);
            generateInitRule();
            setRuleList(readRules());
          },
        });
      };
      const editSuccess = (e: any) => {
        saveProjects(e);
        setProjectList(e);
        generateInitRule();
        setRuleList(readRules());
      };

      return (
        <div className="iproxy-wechat">
          <div className="top-bar">
            <EditDrawer
              onSuccess={editSuccess}
              type="add"
              icon={<PlusOutlined />}
              btnText="新增服务"
              btnType="primary"
            ></EditDrawer>
          </div>
          <Checkbox.Group className="iproxy-wechat-container" value={checkedUtilList} onChange={onUtilChange}>
            <Card title="vConsole 注入" style={{ width: 380 }}>
              <p className="util">注入环境</p>
              <Row>
                {Object.keys(envRuleOption).map((env) => {
                  return (
                    <Col span={6} key={env}>
                      <Checkbox value={`util-console-${env}`}>{env}</Checkbox>
                    </Col>
                  );
                })}
              </Row>
            </Card>
            <Card title="CORS 跨域头注入" style={{ width: 380 }}>
              <p className="util">注入环境</p>
              <Row>
                {Object.keys(envRuleOption).map((env) => {
                  return (
                    <Col span={6} key={env}>
                      <Checkbox value={`util-cors-${env}`}>{env}</Checkbox>
                    </Col>
                  );
                })}
              </Row>
            </Card>
          </Checkbox.Group>
          <Checkbox.Group value={checkedList} className="iproxy-wechat-container" onChange={onChange}>
            {projectList.map((project: any) => {
              return (
                <Card
                  title={project.name}
                  extra={
                    <div className="card-edit">
                      <EditDrawer
                        icon={<EditOutlined style={{ color: '#2f54eb' }} />}
                        data={project}
                        onSuccess={editSuccess}
                      />
                      <DeleteOutlined
                        onClick={() => delProject(project)}
                        style={{ marginLeft: '8px', color: '#f5222d' }}
                      />
                    </div>
                  }
                  style={{ width: 380 }}
                  key={project.name}
                >
                  <p>
                    本地服务
                    {project.isRun && !project.env && (
                      <Tooltip title="端口已开启，未检测到运行环境。请检查端口是否被暂用，或者端口信息是否错误。">
                        <QuestionCircleOutlined style={{ color: '#faad14', marginLeft: '4px' }} />
                      </Tooltip>
                    )}
                  </p>
                  <Row className={`${project.isRun ? 'prot-run' : ''} ${project.env ? 'env-run' : ''}`}>
                    <Col span={12}>
                      <span>端口：</span>
                      <span>{project.port}</span>
                    </Col>
                    <Col span={12}>
                      <span>状态：</span>
                      <span>
                        {!project.isRun ? '未启动' : project.env ? `已启动 ${project.env}` : '未检测到运行环境'}
                      </span>
                    </Col>
                  </Row>
                  <p className="util">代理环境</p>
                  <Row>
                    {Object.keys(envRuleOption).map((env) => {
                      return (
                        <Col span={6} key={env}>
                          <Checkbox value={`${project.name}-${env}`}>{env}</Checkbox>
                        </Col>
                      );
                    })}
                  </Row>
                </Card>
              );
            })}
          </Checkbox.Group>
        </div>
      );
    };

    return WechatProxy;
  }
}
