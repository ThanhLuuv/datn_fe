pipeline {
  agent any

  environment {
    IMAGE        = 'bookstore/frontend'        // Docker image name (tên ảnh)
    TAG          = "${env.BUILD_NUMBER}"  // Tag theo số build
    DEPLOY_DIR   = '/srv/bookstore-frontend'   // Thư mục triển khai trên server
    COMPOSE_FILE = 'docker-compose.yml'
    HEALTH_PORT  = '3002'                 // Cổng để healthcheck
  }

  options { timestamps() }

  stages {
    stage('Checkout (lấy mã)') {
      steps { checkout scm }
    }

    stage('Build Docker image (đóng gói)') {
      steps {
        sh '''
          docker build -t ${IMAGE}:${TAG} -t ${IMAGE}:latest .
        '''
      }
    }

    stage('Prepare deploy dir (chuẩn bị triển khai)') {
      steps {
        sh '''
          mkdir -p ${DEPLOY_DIR}
          rsync -av ${COMPOSE_FILE} ${DEPLOY_DIR}/
        '''
      }
    }

    stage('Deploy with Compose (triển khai)') {
      steps {
        sh '''
          cd ${DEPLOY_DIR}
          export BUILD_TAG=${TAG}
          docker compose -f ${COMPOSE_FILE} up -d
          docker image prune -f || true
        '''
      }
    }

    stage('Healthcheck (kiểm tra sống)') {
      steps {
        sh '''
          for i in {1..30}; do
            if curl -fsS http://103.221.223.103:${HEALTH_PORT} > /dev/null; then
              echo "Healthy on :${HEALTH_PORT}"; exit 0
            fi
            sleep 2
          done
          echo "Healthcheck failed"
          docker compose -f ${DEPLOY_DIR}/${COMPOSE_FILE} logs --no-color frontend || true
          exit 1
        '''
      }
    }
  }

  post {
    success { echo 'Deploy FE OK (Docker Compose)' }
    failure { echo 'Deploy FE FAILED' }
  }
}

