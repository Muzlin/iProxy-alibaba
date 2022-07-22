const defaultProjectList = [
  {
    name: 'qw-mobile',
    entry: 'qw-mobile',
    port: 3000,
    isRun: false,
    env: '',
  },
  {
    name: 'qw-mobile-crm',
    entry: 'mobile-crm',
    port: 3011,
    isRun: false,
    env: '',
  },
  {
    name: 'qw-mobile-workbench',
    entry: 'mobile-workbench',
    port: 3001,
    isRun: false,
    env: '',
  },
  {
    name: 'qw-mobile-todo',
    entry: 'mobile-todo',
    port: 3002,
    isRun: false,
    env: '',
  },
];

// 环境规则配置
const envRuleOption: any = {
  dev1: {
    domain: 'https://wwe06f4f51b3f07982-qw-scrm-dev.dustess.com',
  },
  dev2: {
    domain: 'https://ww7e7bbe5c8dcef524-qw-scrm-dev2.dustess.com',
  },
  dev3: {
    domain: 'https://ww0375f24a08cd639f-qw-scrm-dev3.dustess.com',
  },
  dev4: {
    domain: 'https://ww288a1d8ecaa08b6f-qw-scrm-dev4.dustess.com',
  },
  master1: {
    domain: 'https://wwf6d793ceba440218-qw-scrm-test.dustess.com',
  },
  master2: {
    domain: 'https://wwe794a77fed527d53-qw-scrm-test2.dustess.com',
  },
  master3: {
    domain: 'https://ww1d2ec5f82d2a53a2-qw-scrm-test3.dustess.com',
  },
  master4: {
    domain: 'https://ww3ae68b9d7ca28a8c-qw-scrm-test4.dustess.com',
  },
};

export { defaultProjectList, envRuleOption };
