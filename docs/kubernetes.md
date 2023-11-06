# Running a Firefish server with Kubernetes and Helm

This is a [Helm](https://helm.sh/) chart directory in the root of the project
that you can use to deploy firefish to a Kubernetes cluster

## Deployment

1. Copy the example helm values and make your changes:
```shell
cp .config/helm_values_example.yml .config/helm_values.yml
```

2. Update helm dependencies:
```shell
cd chart
helm dependency list $dir 2> /dev/null | tail +2 | head -n -1 | awk '{ print "helm repo add " $1 " " $3 }' | while read cmd; do $cmd; done;
cd ../
```

3. Create the firefish helm release (also used to update existing deployment):
```shell
helm upgrade \
    --install \
    --namespace firefish \
    --create-namespace \
    firefish chart/ \
    -f .config/helm_values.yml
```

4. Watch your firefish server spin up:
```shell
kubectl -n firefish get po -w
```

5. Initial the admin user and managed config:
```shell
export firefish_USERNAME="my_desired_admin_handle" && \
export firefish_PASSWORD="myDesiredInitialPassword" && \
export firefish_HOST="firefish.example.com" && \
export firefish_TOKEN=$(curl -X POST https://$firefish_HOST/api/admin/accounts/create  -H "Content-Type: application/json" -d "{ \"username\":\"$firefish_USERNAME\", \"password\":\"$firefish_PASSWORD\" }" | jq -r '.token') && \
echo "Save this token: ${firefish_TOKEN}" && \
curl -X POST -H "Authorization: Bearer $firefish_TOKEN" https://$firefish_HOST/api/admin/accounts/hosted
```

6. Enjoy!
