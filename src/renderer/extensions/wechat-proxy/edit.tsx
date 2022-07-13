import { Button, Col, Drawer, Form, Input, message, Row, Select } from 'antd';
import React, { useLayoutEffect, useState } from 'react';
import { generateInitRule, readEnableEnv, readProjects, saveEnableEnv, saveProjects } from './utils';

const EditDrawer = (props: any) => {
  const [visible, setVisible] = useState(false);

  const showDrawer = () => {
    setVisible(true);
  };

  const onClose = () => {
    setVisible(false);
  };

  const onFinish = (values: any) => {
    const projects = readProjects();
    if (props.type === 'add') {
      // 检测端口是否存在
      if (projects.find((item: any) => Number(item.port) === Number(values.port))) {
        message.error('此端口已存在，请修改端口');
        return;
      }
      const newProject = [...projects, ...[{ ...values, ...{ port: Number(values.port), isRun: false, env: '' } }]];
      props.onSuccess(newProject);
      onClose();
    } else {
      /**
       * 修改
       * 1. 删除原来的项目
       * 2. 添加新的项目
       * 3. 已选中的代理环境key同步更新
       * 4. 重新生成rules
       */
      if (
        values.name !== props.data.name ||
        Number(values.port) !== Number(props.data.port) ||
        values.entry !== props.data.entry
      ) {
        // 检测端口是否存在
        if (
          projects
            .filter((item: any) => Number(item.port) !== Number(props.data.port))
            .find((item: any) => Number(item.port) === Number(values.port))
        ) {
          message.error('此端口已存在，请修改端口');
          return;
        }
        const newProject = projects.filter((item: any) => item.name !== props.data.name);
        newProject.push({ ...values, ...{ port: Number(values.port), isRun: false, env: '' } });
        // 已选中的代理环境key同步更新 `${project.name}-${env}`
        const checkedList = readEnableEnv() || [];
        const newCheckedList = checkedList.filter((i: string) => i.indexOf(`${props.data.name}-`) === -1);
        saveEnableEnv(newCheckedList);
        props.onSuccess(newProject);
        onClose();
      } else {
        onClose();
      }
    }
  };

  const [form] = Form.useForm();

  useLayoutEffect(() => {
    const { name, port, entry } = props.data || {};
    form.setFieldsValue({ name, port, entry });
  }, []);

  const checkData = (rule: any, value: any, callback: any) => {
    if (value) {
      if (!/^[0-9a-zA-Z\-]+$/.test(value)) {
        callback(new Error('只能输入数字、字母、中划线，禁止输入空格'));
      } else {
        callback();
      }
    }
  };

  return (
    <>
      <Button size="small" type={props.btnType || 'text'} onClick={showDrawer} icon={props.icon}>
        {props.btnText}
      </Button>

      <Drawer
        title={props.type === 'add' ? '新增服务' : `${props.data.name} 信息修改`}
        width={720}
        onClose={onClose}
        visible={visible}
        bodyStyle={{
          paddingBottom: 80,
        }}
      >
        <Form form={form} layout="vertical" onFinish={onFinish} hideRequiredMark>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="服务名称"
                rules={[
                  {
                    required: true,
                    message: '请输入本地服务名称，一般为项目名称',
                  },
                  { validator: checkData },
                ]}
              >
                <Input allowClear placeholder="请输入本地服务名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="port"
                label="本地端口"
                rules={[
                  {
                    required: true,
                    message: '请输入本地服务的运行端口',
                  },
                  { validator: checkData },
                ]}
              >
                <Input allowClear placeholder="请输入本地服务的运行端口" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="entry"
                label="PublicPath资源基础路径"
                rules={[
                  {
                    required: true,
                    message: '请输入本地项目的PublicPath(资源基础路径)',
                  },
                  { validator: checkData },
                ]}
              >
                <Input allowClear placeholder="请输入本地项目的PublicPath" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  提交
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>
    </>
  );
};

export default EditDrawer;
