# Dockerfile
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]

# Additional PVC for MongoDB (mongodb-pvc.yaml)
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: mongodb-pvc
  namespace: rafalcraft
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi