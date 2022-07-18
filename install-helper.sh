echo "请输入本地登录密码" && sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "/var/folders/04/mzpyk5155mv36svqyxr9wsqr0000gn/T/77098f74-c894-463d-8c5f-cabec0bd189c/root.crt" &&
sudo cp "/Users/lee/Library/Application Support/iProxy/files/proxy_conf_helper"
        "/Users/lee/Library/Application Support/iProxy/proxy_conf_helper"
  && sudo chown root:admin "/Users/lee/Library/Application Support/iProxy/proxy_conf_helper"
  && sudo chmod a+rx+s "/Users/lee/Library/Application Support/iProxy/proxy_conf_helper"
  && touch /tmp/iproxy-install-done && echo "安装完成"
