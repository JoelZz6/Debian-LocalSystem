# Usamos una imagen de Node.js estable
FROM node:20-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos archivos de dependencias
COPY package*.json ./

# Instalamos dependencias
RUN npm install

# Copiamos el resto del código
COPY . .

# Compilamos el proyecto NestJS
RUN npm run build

# Comando para ejecutar la aplicación
# Usamos start:prod para que corra el código compilado
CMD ["npm", "run", "start:prod"]