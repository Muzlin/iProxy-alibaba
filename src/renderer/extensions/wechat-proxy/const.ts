const defaultProjectList = [
    {
        name: 'qw-mobile',
        port: '3000',
        isRun: false,
    },
    {
        name: 'qw-mobile-crm',
        port: '3011',
        isRun: false,
    },
    {
        name: 'qw-mobile-workbench',
        port: '3001',
        isRun: false,
    },
    {
        name: 'qw-scrm-client',
        port: '8090',
        isRun: false,
    },
    {
        name: 'qw-manage-client',
        port: '8088',
        isRun: false,
    },
];

// 环境规则配置
const envRuleOption: any = {
    dev1: {
        domain: 'https://wwe06f4f51b3f07982-qw-scrm-dev.dustess.com',
        enable: false,
    },
    dev2: {
        domain: 'https://ww7e7bbe5c8dcef524-qw-scrm-dev2.dustess.com',
        enable: false,
    },
    dev3: {
        domain: 'https://ww0375f24a08cd639f-qw-scrm-dev3.dustess.com',
        enable: false,
    },
    dev4: {
        domain: 'https://ww288a1d8ecaa08b6f-qw-scrm-dev4.dustess.com',
        enable: false,
    },
    test1: {
        domain: 'https://wwf6d793ceba440218-qw-scrm-test.dustess.com',
        enable: false,
    },
    test2: {
        domain: 'https://wwe794a77fed527d53-qw-scrm-test2.dustess.com',
        enable: false,
    },
    test3: {
        domain: 'https://ww1d2ec5f82d2a53a2-qw-scrm-test3.dustess.com',
        enable: false,
    },
    test4: {
        domain: 'https://ww3ae68b9d7ca28a8c-qw-scrm-test4.dustess.com',
        enable: false,
    },
};

export { defaultProjectList, envRuleOption };
