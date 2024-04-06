# Guide for running Goblin on Kubenetes on bare metal

Details will come in another PR, but in short:

1. Install k8s using microk8s (install microk8s using snap) - best case
   scenario, the script `setup_step_1.sh` can be run on your machine and get
   everything ready. However, this is more likely to work on an empty Debian 12
   server, and less likely if you already have a lot of stuff running on that
   machine. Talk to us on Discord if you want help. https://discord.com/channels/1179534866656792647/1181305871322599454
2. Register a domain / use a domain you already have / set up a subdomain
3. Add a DNS "A record", use the bare metal IP address for the goblin domain.
4. Edit goblin-all-in-one.yaml - basically this file contains all you should
   need after your k8s setup is running correctly. Be sure to change the 
5. I have not yet figured out where to make the Goblin Docker image public,
   so in case you build your own, you can enable your microk8s registry
   with `microk8s.enable registry`, enable it as insecure registry in docker 
   config file (`nano ~/.docker/config.json`), and then build and upload this 
   repo into it: `docker build -t localhost:32000/my_goblin:123 .` (in this repo's folder)
   and `docker push localhost:32000/my_goblin:123`, and change the goblin-all-in-one.yaml 
   to replace `registry.stopdelaying.com/mb/goblin:16`
   with your own image - something like `localhost:32000/my_goblin:123`
   The image will take about 2GB of space.
   Ideally, you can skip this step and just talk to me in Discord about getting 
   access to the image I build, which will later come from CI/CD.
6. Copy `cluster_aliases.sh` to your server and add something like 
   `source ~/cluster_aliases.sh` to the end of your `~/.bashrc` file - trust
   me, this will radically improve your experience with kubernetes. Source the
   file in your current console window now.
7. Run `k create -f /path/to/goblin-all-in-one.yaml` and run `po` until the postgres
   is up and running
8. Set up postgres with something like:
```
kexe goblin-postgres bash
postgres=# CREATE DATABASE goblin;
postgres=# \c goblin
goblin=# CREATE USER goblin WITH PASSWORD 'ASDF_CHANGE_THIS_PASSWORD_TOO';
goblin=# GRANT ALL ON DATABASE goblin TO goblin;
goblin=# GRANT ALL ON SCHEMA public TO goblin;
```
   (Change the password above, and make sure the same one is in the configmap
   you created; if not, run `k edit cm goblin-config` and edit the needed values)
9. Add SSL to your website - CHANGE THE EMAIL FIRST:
   (See https://microk8s.io/docs/addon-cert-manager if needed.)
```
microk8s kubectl apply -f - <<EOF
---
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
 name: lets-encrypt
spec:
 acme:
   email: CHANGE_THIS_TO_YOUR_ACTUAL_EMAIL!!!@example.com
   server: https://acme-v02.api.letsencrypt.org/directory
   privateKeySecretRef:
     # Secret resource that will be used to store the account's private key.
     name: lets-encrypt-private-key
   # Add a single challenge solver, HTTP01 using nginx
   solvers:
   - http01:
       ingress:
         class: public
EOF
```
10. Now you need to edit the ingress:
    `k edit ing goblin` and add two lines:
    `cert-manager.io/cluster-issuer: letsencrypt-prod` under the first metadata->annotations
    and then closer to the end, above "status:" (also: change it to your domain) 
```
  tls:
    - hosts:
      - YOUR_GOBLIN_DOMAIN.example.com
```
11. Run `po` again to make sure everything is up and running, and run 
    `k create -f /path/to/only-goblin-deploy.yaml`
12. This should run the database migrations and spin up the server
13. If you need to check the status, run `klog goblin` or `ktail goblin`
14. If you need to run something inside the goblin pod, run `kexe goblin bash`
15. If you need to restart the goblin server, run `po` and `killpod goblin-something`
    but replace the something with the hash. `killpod` does a wildcard match, so
    just `killpod goblin` would restart the redis and postgres too.

Hopefully half of this will be automated later.
