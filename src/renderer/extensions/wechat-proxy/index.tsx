import React, { useEffect, useState } from 'react';
// @ts-ignore
import { Extension } from '../../extension';
import { message, Checkbox, Card, Row, Col, Switch } from 'antd';
import './index.less';
import { Rule } from '../rule-editor/components/rule-list';
import { defaultProjectList, envRuleOption } from './const';
import { checkPort, generateInitRule, readRules, saveRules } from './utils';

export class WechatProxy extends Extension {
    constructor() {
        super('wechat-proxy');
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
            const [projectList, setProjectList] = useState<any>(defaultProjectList);
            const [checkedList, setCheckedList] = useState<any>([]);
            useEffect(() => {
                setCheckedList(ruleList.filter((item: any) => item.enabled).map((item: any) => item.name));
            }, [ruleList]);
            const onChange = (e: any) => {
                saveRules(
                    ruleList.map((item: any) => {
                        item.enabled = e.includes(item.name);
                        return item;
                    }),
                );
                setCheckedList(e);
            };
            return (
                <Checkbox.Group value={checkedList} className="iproxy-wechat-container" onChange={onChange}>
                    {projectList.map((project: any) => {
                        return (
                            <Card
                                title={`${project.name}:${project.port}`}
                                extra={<a href="#">信息修改</a>}
                                style={{ width: 350 }}
                                key={project.name}
                            >
                                <p>代理环境</p>
                                <Row>
                                    {Object.keys(envRuleOption).map((env) => {
                                        return (
                                            <Col span={6} key={env}>
                                                <Checkbox value={`${project.name}-${env}`}>{env}</Checkbox>
                                            </Col>
                                        );
                                    })}
                                </Row>
                                <p className="util">工具</p>
                                <Row>
                                    <Col className="item" span={12}>
                                        <span className="name">vConsole</span>
                                        <Switch
                                            checkedChildren="已注入"
                                            unCheckedChildren="未注入"
                                            defaultChecked={false}
                                            disabled
                                            size="small"
                                        />
                                    </Col>
                                    <Col className="item" span={12}>
                                        <span className="name">CORS跨域头</span>
                                        <Switch
                                            checkedChildren="已注入"
                                            unCheckedChildren="未注入"
                                            defaultChecked={false}
                                            disabled
                                            size="small"
                                        />
                                    </Col>
                                </Row>
                            </Card>
                        );
                    })}
                </Checkbox.Group>
            );
        };

        return WechatProxy;
    }
}
