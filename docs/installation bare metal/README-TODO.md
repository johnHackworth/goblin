### Baseline
* Empty server installation works on Hetzner
* kubernetes yaml for every component needed in an empty k8s cluster (configmap, ingress, nginx, app, postgres, redis, redis2, meilisearch)
* ingress and all that stuff
* some (optional) auto-update to latest 

### Nice to have
* setup scripts works if the cluster is already half setup
* explain mirrord or devspace + add guide for that
* as much as possible in terminal-kit questions, and not FAQs and long guides 
* splitting docker image into {fo be ws}

### Low prio
* explanations for people with no IT background at all
* packer
* helm (ew)
* CRD/Operator (extremely low priority but could be a fun project)
