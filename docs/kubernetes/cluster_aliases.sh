alias kubectl=microk8s.kubectl
alias k=kubectl
alias helm=kubectl.helm3

# this changes default kubectl edit editor from vim to something sane
export KUBE_EDITOR=nano

# this helper regexp assumes you'll have less than 11 pods in one statefulset
POD_SUFFIX_REGEX="(([a-z0-9]{8,10})-[a-z0-9]{5}|[a-z0-9]{5}|[0-9]{1})$"

function resource-exists() {
  resource=$1
  name=$2
  namespace=$3
  resourceSearch=$(kubectl get $resource $name -n $namespace --ignore-not-found | grep $name)
  test ! -z "$resourceSearch"
}

function killpod() {
  local PODNAME=$(kubectl get pods | grep $1 | cut -d " " -f1)
  kubectl delete po $PODNAME
}

alias ki="k -n ingress"
alias kk="k -n kibana"

alias po="pons default"

function pons() {
  NAMESPACE=$1
  if [[ -z $NAMESPACE ]]; then
    NAMESPACE=$(kubectl config view --minify --output 'jsonpath={..namespace}')
  fi

  if [[ -z $NAMESPACE ]]; then
    NAMESPACE='default'
  fi

  if [[ -z $2 ]]; then
    kubectl get po -n $NAMESPACE --sort-by=.metadata.name
  else
    kubectl get po -n $NAMESPACE --sort-by=.metadata.name | egrep $2
  fi
}
function no() {
  if [[ -z $1 ]]; then
    k get no -o wide --show-labels
  else
    k get no -o wide --show-labels | egrep $1
  fi
}
function dp() {
  if [[ -z $1 ]]; then
    k get deploy -o wide
  else
    k get deploy -o wide | egrep $1
  fi
}
alias depl=dp
alias deploy=dp
function rc() {
  if [[ -z $1 ]]; then
    k get rc -o wide
  else
    k get rc -o wide | egrep $1
  fi
}
function svc() {
  if [[ -z $1 ]]; then
    k get svc -o wide
  else
    k get svc -o wide | egrep $1
  fi
}
function vs() {
  if [[ -z $1 ]]; then
    k get vs -o wide
  else
    k get vs -o wide | egrep $1
  fi
}
function evs() {
  if [[ -z $1 ]]; then
    kubectl get events --sort-by='.metadata.creationTimestamp'
  else
    kubectl get events --sort-by='.metadata.creationTimestamp' $2 | egrep $1
  fi
}

function endp() {
  if [[ -z $1 ]]; then
    k get endpoints --all-namespaces
  else
    k get endpoints --all-namespaces | egrep $1
  fi
}

function dockps() {
  docker ps | grep -v pause | awk '{print $2}'
}

function waitfor() {
  echo -n Waiting for $1
  sleep 1
  while [[ $(po | grep "$1" | grep -c 'Running\|Completed' | awk '{$1=$1};1') != $(po | grep "$1" | wc -l | awk '{$1=$1};1') ]]; do
    echo -n .
    sleep 1
  done
  echo " - done."
}

function waitfor_ns() {
  echo -n Waiting for $2 in ns $1
  while [[ $(k -n $1 get po -o wide | grep "$2" | grep -c 'Running\|Completed' | awk '{$1=$1};1') != $(k -n $1 get po -o wide | grep "$2" | wc -l | awk '{$1=$1};1') ]]; do
    echo -n .
    sleep 1
  done
  echo " - done."
}

function waitfor_gone() {
  # this is useful only if your kill command actually makes it NOT respawn
  # e.g. deleting a deploy, sts, job, etc; NOT for killing a pod that will come back
  NS=$1
  POD_GREP_NAME=$2
  KILL_COMMAND=$3
  PREV_COUNT=$(k get po -n $NS | grep "$POD_GREP_NAME" | wc -l)
  if [[ "$PREV_COUNT" != "0" ]]; then
    eval $KILL_COMMAND
    echo -n "Waiting for $2 in ns $1 /$(k get po -n $NS | grep "$POD_GREP_NAME" | wc -l)/ [$PREV_COUNT]"
    while [[ "[$(k get po -n $NS | grep "$POD_GREP_NAME" | wc -l)]" = "[$PREV_COUNT]" ]]; do
      echo -n .
      sleep 1
    done
    echo -n " - done."
  fi
}

function waitfor_kibana() {
  while [[ $(kubectl get po -n kibana | grep $1 | grep -c 'Running\|Completed' | awk '{$1=$1};1') != $(kubectl get po -n kibana | grep $1 | wc -l | awk '{$1=$1};1') ]]; do
    echo -n .
    sleep 1
  done
  resp_status_code=0
  while [ ${resp_status_code:=0} != 200 ]; do
    sleep 0.5
    resp_status_code=$(kubectl exec -n kibana $1 -- curl -sL -w "%{http_code}" "localhost:9200/_cat/nodes" -o /dev/null)
    echo -n .
  done
  echo " - done."
}

function waitforall() {
  while [[ $(po | grep -c Running) != $(po | sed 1d | wc -l) ]]; do
    sleep 3
    echo -en "\r"$(date) - $(po | grep -c Running)/$(po | sed 1d | wc -l) pods running
  done
  echo
}

function whologs() {
  local GREPSTR=$1
  local LIST=$(kubectl get pods -o jsonpath={..metadata.name})
  if [[ $GREPSTR == '' ]]; then
    for i in $LIST; do
      echo "-----$i-----"
      kubectl logs $i | wc -l
    done
  else
    for i in $LIST; do
      echo "-----$i-----"
      kubectl logs $i | grep "$GREPSTR" | wc -l
    done
  fi
}

function __klog() {
  if [[ $2 ]]; then
    CONTNAME=$2
  else
    CONTNAME=$(echo $1 | sed -re "s/-$POD_SUFFIX_REGEX/ /g")
  fi
  if [[ $3 ]]; then
    kubectl logs -f $1 -c $CONTNAME | grep $3
  else
    kubectl logs -f $1 -c $CONTNAME
  fi
}

function __klog_ns() {
  if [[ $3 ]]; then
    CONTNAME=$3
  else
    CONTNAME=$(echo $2 | sed -re "s/-$POD_SUFFIX_REGEX/ /g")
  fi
  if [[ $4 ]]; then
    kubectl logs -n $1 -f $2 -c $CONTNAME | grep $4
  else
    kubectl logs -n $1 -f $2 -c $CONTNAME
  fi
}

function __ktail() {
  if [[ $2 ]]; then
    CONTNAME=$2
  else
    CONTNAME=$(__getDefaultContainerName $1)
  fi
  if [[ $3 ]]; then
    kubectl logs -f $1 --tail=100 -c $CONTNAME | grep $3
  else
    kubectl logs -f $1 --tail=100 -c $CONTNAME
  fi
}


function klog() {
  EXACTMATCHPODNAME=$(__getExactPodName $1)
  if [[ -n $EXACTMATCHPODNAME ]]; then
    CONTNAME=$(__getDefaultContainerName $EXACTMATCHPODNAME)
    __klog $EXACTMATCHPODNAME $CONTNAME $2
    return 0
  fi
  CONTID=$(__askForPodName $1)
  CONTNAME=$(__getDefaultContainerName $CONTID)
  __klog $CONTID $CONTNAME $2
}

function klog_ns() {
  EXACTMATCHPODNAME=$(__getExactPodName_ns $1 $2)
  if [[ -n $EXACTMATCHPODNAME ]]; then
    CONTNAME=$(__getDefaultContainerName $EXACTMATCHPODNAME)
    __klog_ns $1 $EXACTMATCHPODNAME $CONTNAME $3
    return 0
  fi
  CONTID=$(__askForPodName_ns $1 $2)
  CONTNAME=$(__getDefaultContainerName $CONTID)
  __klog_ns $1 $CONTID $CONTNAME $3
}

function klogc() {
  EXACTMATCHPODNAME=$(__getExactPodNameCore $1)
  if [[ -n $EXACTMATCHPODNAME ]]; then
    CONTNAME=$(__getDefaultContainerName $EXACTMATCHPODNAME)
    __klogc $EXACTMATCHPODNAME $CONTNAME $2
    return 0
  fi
  CONTID=$(__askForPodNameCore $1)
  CONTNAME=$(__getDefaultContainerName $CONTID)
  __klogc $CONTID $CONTNAME $2
}

function __getExactPodName() {
  kubectl get pods -o name | cut -d "/" -f2 | grep -E "^$1-$POD_SUFFIX_REGEX" | head -n 1
}
function __getExactPodName_ns() {
  kubectl get pods -n $1 -o name | cut -d "/" -f2 | grep -E "^$2-$POD_SUFFIX_REGEX" | head -n 1
}

function __getDefaultContainerName() {
  echo $1 | sed -re "s/-$POD_SUFFIX_REGEX/ /g"
}

function __askForPodName() {
  KUBEIDS=$(po | grep Running | grep $1 | cut -d \  -f 1)
  COUNT=$(echo "$KUBEIDS" | wc -l)
  if [[ $COUNT == 0 ]]; then
    return 0
  elif [[ $COUNT > 1 ]]; then
    PS3='Sorry I am a dumbass and can not decide which container you want. Eh? '
    select KUBEID in $KUBEIDS; do
      case $KUBEID in
      *)
        #        echo "You picked $KUBEID ($REPLY)"
        CONTID=$KUBEID
        break
        ;;
      esac
    done
  else
    CONTID=$(echo $KUBEIDS | head -n1)
  fi
  echo $CONTID
}

function __askForPodName_ns() {
  KUBEIDS=$(k get po -n $1 | grep Running | grep $2 | cut -d \  -f 1)
  COUNT=$(echo "$KUBEIDS" | wc -l)
  if [[ $COUNT == 0 ]]; then
    return 0
  elif [[ $COUNT > 1 ]]; then
    PS3='Sorry I am a dumbass and can not decide which container you want. Eh? '
    select KUBEID in $KUBEIDS; do
      case $KUBEID in
      *)
        #        echo "You picked $KUBEID ($REPLY)"
        CONTID=$KUBEID
        break
        ;;
      esac
    done
  else
    CONTID=$(echo $KUBEIDS | head -n1)
  fi
  echo $CONTID
}
function ktail() {
  EXACTMATCHPODNAME=$(__getExactPodName $1)
  if [[ ! -z $EXACTMATCHPODNAME ]]; then
    CONTNAME=$(__getDefaultContainerName $EXACTMATCHPODNAME)
    __ktail $EXACTMATCHPODNAME $CONTNAME $2
    return 0
  fi
  CONTID=$(__askForPodName $1)
  CONTNAME=$(__getDefaultContainerName $CONTID)
  __ktail $CONTID $CONTNAME $2
}

# you can use e.g. kexe auth-cb 'cat /project/Dockerfile'
# does not work with bash as we don't get TTY if we run commands through pipes (I think?)
function kexe() {
  CONTID=$(__askForPodName $1)
  kubectl exec $CONTID -ti -- env TERM=xterm $2
}
function kexec() {
  CONTID=$(__askForPodNameCore $1)
  kc exec $CONTID -ti -- env TERM=xterm $2
}

function kdb() {
  local podname=$(po | grep maindb | head -n1 | cut -d \  -f 1)
  kubectl exec $podname -ti -- bash -c 'psql -U postgres $1'
}

function checkmem() {
  # for i in $(docker images --no-trunc -q | sort -u); do sleep 3; docker rmi $i; done
  KUBEIDS=$(po | grep Running | grep $1 | cut -d \  -f 1)
  COUNT=$(po | grep Running | grep $1 | cut -d \  -f 1 | wc -l)
  if [[ $COUNT > 1 ]]; then
    PS3='Sorry I am a dumbass and can not decide which container you want. Eh? '
    select CONTNAME in $KUBEIDS; do
      case $CONTNAME in
      *)
        echo "You picked $CONTNAME ($REPLY)"
        CONTID=$(docker ps | grep $CONTNAME | grep -v pause | cut -d \  -f 1 | head -n1)
        break
        ;;
      esac
    done
  else
    CONTID=$(docker ps | grep $KUBEIDS | grep -v pause | cut -d \  -f 1 | head -n1)
  fi
  while sleep 2; do echo -en $(docker top $CONTID); done
}

function namespace_path() {
  NAMESPACE=$(GET_NAMESPACE "$1")
  MAYBE_ENV=$2
  COOLENV=${MAYBE_ENV:='dev'}
  ENVPATH=$COOLENV
  if [[ $NAMESPACE != 'default' ]]; then
    ENVPATH=$NAMESPACE/$COOLENV
  fi
  echo "$ENVPATH"
}

function GET_NAMESPACE() {
  NAMESPACE=$1
  if [[ -z $NAMESPACE ]]; then
    NAMESPACE=$(kubectl config view --minify --output 'jsonpath={..namespace}')
  fi
  if [[ -z $NAMESPACE ]]; then
    NAMESPACE='default'
  fi
  echo "$NAMESPACE"
}

