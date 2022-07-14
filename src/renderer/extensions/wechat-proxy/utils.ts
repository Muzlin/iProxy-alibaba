import { CoreAPI } from '../../core-api';
import { Rule } from '../rule-editor/components/rule-list';
import { defaultProjectList, envRuleOption } from './const';

const RULE_STORE_KEY = 'wechat-proxy-rules';
const PROJECT_STORE_KEY = 'wechat-proxy-projects';
// 已开启代理的环境key
const ENABLE_ENV_STORE_KEY = 'wechat-proxy-enable-env';
// 工具注入key
const UTIL_STORE_KEY = 'wechat-proxy-util';

const saveUtil = (util: any) => {
  CoreAPI.store.set(UTIL_STORE_KEY, util);
};

const readUtil = () => {
  return CoreAPI.store.get(UTIL_STORE_KEY);
};

const saveEnableEnv = (env: any) => {
  CoreAPI.store.set(ENABLE_ENV_STORE_KEY, env);
};

const readEnableEnv = () => {
  return CoreAPI.store.get(ENABLE_ENV_STORE_KEY);
};

const saveProjects = (projects: any) => {
  CoreAPI.store.set(PROJECT_STORE_KEY, projects);
};

const readProjects = () => {
  return CoreAPI.store.get(PROJECT_STORE_KEY);
};

const saveRules = (rules: Rule[]) => {
  CoreAPI.store.set(RULE_STORE_KEY, rules);
  CoreAPI.eventEmmitter.emit('whistle-save-rule', rules);
};

const readRules = () => {
  return CoreAPI.store.get(RULE_STORE_KEY);
};

// 初始化所有环境的代理规则
function generateInitRule() {
  /**
    * 推入规则
    * name: project.name + 环境
      enabled: false,
      uuid: `wechat-proxy-${project.name + 环境}`,
      content: p.rule
    # 企微授权接口流量走对应环境
    ^https://wwe794a77fed527d53-qw-scrm-test2.dustess.com/wxwork/v1/*** https://wwe794a77fed527d53-qw-scrm-test2.dustess.com/wxwork/v1/$1
    # 将入口html文件代理至本地服务
    # eg. https://wwe794a77fed527d53-qw-scrm-test2.dustess.com/mobile-crm/
    # eg. https://wwe794a77fed527d53-qw-scrm-test2.dustess.com/mobile-workbench/
    # eg. https://wwe794a77fed527d53-qw-scrm-test2.dustess.com/mobile-mk/
    ^https://wwe794a77fed527d53-qw-scrm-test2.dustess.com/*** http://localhost:3011/$1
    ^https://wwe794a77fed527d53-qw-scrm-test2.dustess.com/mobile-crm/***  http://localhost:3011/mobile-crm/$1
    `
  */
  // 获取项目列表（没有则读取预设的项目,并写入）
  let projects: any = readProjects();
  if (!projects?.length) {
    saveProjects(defaultProjectList);
    projects = defaultProjectList;
  }

  // 获取已开启代理的环境key
  const proxyEnv = readEnableEnv() || [];

  // 获取已开启工具注入的环境key
  const utilKey = readUtil() || [];

  const savedRules = readRules();
  // if (savedRules?.length > 0 && !init) {
  //   return;
  // }
  const rules: any = [];
  const style = `\`
  <div style="
  width: 61px;
  height: 22px;
  position: fixed;
  left: 0;
  bottom: 0;
  border-radius: 12px;
  font-size: 20px;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;
  color: #52c41a;
  font-weight: bold;
  z-index: 9999;
  ">iProxy</div>
  \``;
  projects.forEach((project: any) => {
    // 每个环境单独生成规则
    Object.keys(envRuleOption).forEach((env) => {
      const entryRule = project.entry ? `${project.entry}/` : '';
      rules.push({
        name: `${project.name}-${env}`,
        enabled: proxyEnv.includes(`${project.name}-${env}`),
        uuid: `wechat-proxy-${project.name}-${env}`,
        content: `
                # 添加代理成功标识
                ${envRuleOption[env].domain}/${entryRule} htmlPrepend://${style}
                # 企微授权接口流量走对应环境
                ^${envRuleOption[env].domain}/wxwork/v1/*** ${envRuleOption[env].domain}/wxwork/v1/$1
                # 将入口html文件代理至本地服务
                ^${envRuleOption[env].domain}/${entryRule}*** http://localhost:${project.port}/${entryRule}$1
                `,
      });
    });
  });
  // 生成工具注入规则
  /**
   * 注入 vConsole
   * github.com/xcodebuild/iproxy htmlPrepend://`
      <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
      <script>eruda.init();</script>
    }`
   */
  const utilStr = `\`
  <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
  <script>eruda.init();</script>
  \``;
  Object.keys(envRuleOption).forEach((env) => {
    rules.push({
      name: `util-console-${env}`,
      enabled: utilKey.includes(`util-console-${env}`),
      uuid: `wechat-proxy-util-console-${env}`,
      content: `
      ${envRuleOption[env].domain} htmlPrepend://${utilStr}
      `,
    });
    rules.push({
      name: `util-cors-${env}`,
      enabled: utilKey.includes(`util-cors-${env}`),
      uuid: `wechat-proxy-util-cors-${env}`,
      content: `
      ${envRuleOption[env].domain} htmlPrepend://${utilStr}
      `,
    });
  });
  saveRules(rules);
  console.log('init rules', rules);
}

export {
  generateInitRule,
  readRules,
  saveRules,
  saveProjects,
  readProjects,
  saveEnableEnv,
  readEnableEnv,
  saveUtil,
  readUtil,
};
