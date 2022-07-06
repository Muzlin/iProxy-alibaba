import net from 'net';
import { CoreAPI } from '../../core-api';
import { Rule } from '../rule-editor/components/rule-list';
import { defaultProjectList, envRuleOption } from './const';
// 检测端口是否被占用
const checkPort = (port: any) => {
    const server = net.createServer().listen(Number(port));
    return new Promise((resolve) => {
        server.on('listening', () => {
            console.log(`the server is runnint on port ${port}`);
            server.close();
            resolve(false);
        });
        server.on('error', (err: any) => {
            if (err.code === 'EADDRINUSE') {
                console.log(`this port ${port} is occupied.try another.`);
                resolve(true);
            }
        });
    });
};

const RULE_STORE_KEY = 'wechat-proxy-rules';

const saveRules = (rules: Rule[]) => {
    CoreAPI.store.set(RULE_STORE_KEY, rules);
    CoreAPI.eventEmmitter.emit('whistle-save-rule', rules);
};

const readRules = () => {
    return CoreAPI.store.get(RULE_STORE_KEY);
};

// 初始化所有环境的代理规则
function generateInitRule(init = false) {
    /**
     * 推入规则
     *   name: project.name + 环境
        enabled: false,
          uuid: `wechat-proxy-${project.name + 环境}`,
          content: p.rule
    # 企微授权接口流量走对应环境
    ^https://wwe794a77fed527d53-qw-scrm-test2.dustess.com/wxwork/v1/*** https://wwe794a77fed527d53-qw-scrm-test2.dustess.com/wxwork/v1/$1
    # 将所有流量打至本地
    ^https://wwe794a77fed527d53-qw-scrm-test2.dustess.com/*** http://localhost:3011/$1
    `
  */
    const saveRules = readRules();
    if (saveRules?.length > 0 && !init) {
        console.log('rules', saveRules);
        return;
    }
    const rules: any = [];
    defaultProjectList.forEach((project) => {
        // 每个环境单独生成规则
        Object.keys(envRuleOption).forEach((env) => {
            rules.push({
                name: `${project.name}-${env}`,
                enabled: false,
                uuid: `wechat-proxy-${project.name}-${env}`,
                content: `
                # 企微授权接口流量走对应环境
                ^${envRuleOption[env].domain}/wxwork/v1/*** ${envRuleOption[env].domain}/wxwork/v1/$1
                # 将除授权以外静态资源流量打至本地
                ^${envRuleOption[env].domain}/*** http://localhost:${project.port}/$1
                `,
            });
        });
    });
    saveRules(rules);
    console.log('rules', readRules());
}

export { checkPort, generateInitRule, readRules, saveRules };
