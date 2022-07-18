/**
 * TODO: 证书安装失败机器
 * sudo cp ~/Library/Application\ Support/LightProxy/files/proxy_conf_helper ~/Library/Application\ Support/LightProxy/proxy_conf_helper
  sudo chmod +s ~/Library/Application\ Support/LightProxy/proxy_conf_helper
 */

/**
 * 证书安装
 * Helper 安装等
 */
//@ts-ignore
import fs from 'fs-extra-promise';
//@ts-ignore
import tempdir from 'tempdir';
import path from 'path';
//@ts-ignore
import sudo from 'sudo-prompt';
//@ts-ignore
import forge from 'node-forge';
import { execSync } from 'child_process';
import {
  CERT_KEY_FILE_NAME,
  CERT_FILE_NAME,
  IPROXY_CERT_DIR_PATH,
  IPROXY_CERT_KEY_PATH,
  SYSTEM_IS_MACOS,
  SYSTEM_IS_LINUX,
  PROXY_CONF_HELPER_PATH,
  PROXY_CONF_HELPER_FILE_PATH,
} from './const';
import { clipboard, dialog, app } from 'electron';
import treeKill from 'tree-kill';

import logger from 'electron-log';

import * as shell from 'shelljs';

const pki = forge.pki;

const sudoOptions = {
  name: 'iProxy',
};

async function generateCert() {
  return new Promise((resolve) => {
    const keys = pki.rsa.generateKeyPair(2048);
    const cert = pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = new Date().getTime() + '';
    cert.validity.notBefore = new Date();
    cert.validity.notBefore.setFullYear(cert.validity.notBefore.getFullYear() - 10);
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 10);

    const attrs = [
      {
        name: 'commonName',
        value: 'iProxy-' + new Date().toISOString().slice(0, 10),
      },
      {
        name: 'countryName',
        value: 'CN',
      },
      {
        shortName: 'ST',
        value: 'Hangzhou',
      },
      {
        name: 'localityName',
        value: 'Hangzhou',
      },
      {
        name: 'organizationName',
        value: 'iProxy',
      },
      {
        shortName: 'OU',
        value: 'https://github.com/xcodebuild/iproxy',
      },
    ];

    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.setExtensions([
      {
        name: 'basicConstraints',
        critical: true,
        cA: true,
      },
      {
        name: 'keyUsage',
        critical: true,
        keyCertSign: true,
      },
      {
        name: 'subjectKeyIdentifier',
      },
    ]);
    cert.sign(keys.privateKey, forge.md.sha256.create());
    const certPem = pki.certificateToPem(cert);
    const keyPem = pki.privateKeyToPem(keys.privateKey);

    resolve({
      key: keyPem,
      cert: certPem,
    });
  });
}

function alertAndQuit(title?: string, message?: string) {
  dialog.showErrorBox(
    title || '授权失败',
    message ||
      `
      安装证书或者 helper 过程中授权失败
      macOS 用户请尝试在弹出的对话框中输入用户密码
      Windows 用户请尝试打开在 属性 => 兼容性 => 以管理员身份运营该应用
      Deepin GNU/Linux 用户请安装libnss3-tools然后重启本软件

      应用程序即将退出
    `,
  );
  treeKill(process.pid);
}

export async function installCertAndHelper() {
  console.log('Install cert');
  const certs = (await generateCert()) as {
    key: string;
    cert: string;
  };

  const dir = (await tempdir()).replace('ADMINI~1', 'Administrator');

  // 写入证书
  await fs.mkdirp(dir);
  await fs.writeFileAsync(path.join(dir, CERT_KEY_FILE_NAME), certs.key, 'utf-8');
  await fs.writeFileAsync(path.join(dir, CERT_FILE_NAME), certs.cert, 'utf-8');

  const formatPath = (path: string) => '"' + path + '"';

  const INSTALL_DONE_FILE = '/tmp/iproxy-install-done';
  // 信任证书 & 安装 helper1
  const installPromise = new Promise((resolve, reject) => {
    if (SYSTEM_IS_MACOS) {
      const cmd = `echo "请输入本地登录密码" && sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "${path.join(
        dir,
        CERT_FILE_NAME,
      )}" && sudo cp ${formatPath(PROXY_CONF_HELPER_FILE_PATH)} ${formatPath(
        PROXY_CONF_HELPER_PATH,
      )} && sudo chown root:admin ${formatPath(PROXY_CONF_HELPER_PATH)} && sudo chmod a+rx+s ${formatPath(
        PROXY_CONF_HELPER_PATH,
      )} && touch ${INSTALL_DONE_FILE} && echo "安装完成"`;

      const showGuide = (openTerminal = true) => {
        // 复制命令到剪贴板
        clipboard.writeText(cmd);
        if (openTerminal) {
          try {
            logger.info('打开终端');
            const pathStr = path.join(dir, 'install-helper.sh');
            logger.info('pathStr', pathStr);
            // 打开终端命令
            const autoCmd = `echo '${cmd}' > ${pathStr}`;
            // 输出命令到脚本
            execSync(autoCmd);
            // 给脚本增加运行权限
            execSync(`chmod 777 ${pathStr}`);
            // 打开终端运行
            execSync(`open -a Terminal ${pathStr}`);
          } catch (error) {
            logger.error('打开终端', error);
          }
        }

        const integer = dialog.showMessageBoxSync({
          type: 'info',
          textWidth: 360,
          defaultId: 1,
          buttons: ['太麻烦了，不用了', '我已经安装了'],
          message: `如果你的终端自动打开，请按步骤完成证书安装。

                    如果你的终端没有打开，请各位老六自己打开。

                    命令已经复制到了剪贴板，粘贴命令到终端并运行以安装并信任证书
                   `,
        });
        if (integer === 0) {
          console.log('User cancel');
          reject('customer');
          return;
        } else {
          logger.info('check file', fs.existsSync(INSTALL_DONE_FILE));
          if (!fs.existsSync(INSTALL_DONE_FILE)) {
            showGuide(false);
          } else {
            resolve(true);
          }
        }
      };
      showGuide();
    } else if (SYSTEM_IS_LINUX) {
      // only tested in deepin
      if (!shell.which('certutil')) {
        reject('证书未成功安装，请先确认libnss3-tools是否安装');
      } else {
        const command = `certutil -d sql:$HOME/.pki/nssdb -A -t "C,," -n iProxy -i "${path.join(
          dir,
          CERT_FILE_NAME,
        )}" && touch ${INSTALL_DONE_FILE} && echo "安装完成"`;
        console.log('run command', command);
        try {
          const output = execSync(command, {
            // @ts-ignore
            windowsHide: true,
          });
          console.log('certutil result', output.toString());
        } catch (e) {
          // @ts-ignore
          console.log('error', e.message, e.stderr.toString(), e.stdout.toString());
        }
      }
      resolve(true);
    } else {
      dialog.showMessageBoxSync({
        type: 'info',
        message: `未安装证书/代理helper或者已经过期，需要安装，可能会需要输入登录用户的密码。`,
      });
      fs.copyFileSync(PROXY_CONF_HELPER_FILE_PATH, PROXY_CONF_HELPER_PATH);
      const command = `certutil -enterprise -f -v -AddStore "Root" "${path.join(
        dir,
        CERT_FILE_NAME,
      )}"  && sudo cp "${PROXY_CONF_HELPER_FILE_PATH}" "${PROXY_CONF_HELPER_PATH}" && sudo chown root:admin "${PROXY_CONF_HELPER_PATH}" && sudo chmod a+rx+s "${PROXY_CONF_HELPER_PATH}"`;
      console.log('run command', command);
      try {
        const output = execSync(command, {
          // @ts-ignore
          windowsHide: true,
        });
        console.log('certutil result', output.toString());
      } catch (e) {
        // @ts-ignore
        console.log('error', e.message, e.stderr.toString(), e.stdout.toString());
      }

      // windows dose not need install helper
      resolve(true);
    }
  });

  console.log('before install');
  try {
    await installPromise;
  } catch (e) {
    console.error(e);
    let title;
    let message;
    if (e === 'customer') {
      title = 'FBI WARNING';
      message = 'BP 是个老六 😁';
    }
    alertAndQuit(title, message);
    // prevent copy cert after failed
    return;
  }
  console.log('after install');
  // 信任完成，把证书目录拷贝过去
  await fs.copyAsync(dir, IPROXY_CERT_DIR_PATH);
  console.log('copy cert done');
}

async function checkCertInstall() {
  const certKeyExist = await fs.existsAsync(IPROXY_CERT_KEY_PATH);
  if (!certKeyExist) {
    return false;
  }
  const { ctimeMs } = await fs.statAsync(IPROXY_CERT_KEY_PATH);

  // expire at 11 month(cert expire in 1 year in fact)
  const expireTime = ctimeMs + 11 * 30 * 24 * 60 * 60 * 1000;
  const currentTime = Date.now();
  logger.info({ ctimeMs, certKeyExist, expireTime, currentTime });

  return currentTime < expireTime;
}

async function checkHelperInstall() {
  if (!SYSTEM_IS_MACOS) {
    return true;
  }
  if (!(await fs.existsAsync(PROXY_CONF_HELPER_PATH))) {
    return false;
  }
  const info = await fs.statAsync(PROXY_CONF_HELPER_PATH);
  if (info.uid !== 0) {
    // 权限不对
    return false;
  }
  return true;
}

// 检查安装状态，如果没安装就安装一下
export default async function checkInstallStatus() {
  logger.info('mac helper path', PROXY_CONF_HELPER_PATH);
  if ((await checkCertInstall()) && (await checkHelperInstall())) {
    // pass
  } else {
    await installCertAndHelper();
  }
}
