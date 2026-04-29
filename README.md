###### PASOS PARA TENERLO BIEN CONFIGURADO EN OTRAS PC

# 1. Actualizar Debian (COMO SUPERUSUARIO)
  apt update
  apt upgrade
  apt full-upgrade
  apt autoremove
  /usr/sbin/reboot

# 2. Instalar Docker Engine + el plugin Docker Compose V2 (TODO EN SU PAGINA OFICIAL, CAMBIA CON EL TIEMPO)
    LINK ---> https://docs.docker.com/engine/install/debian/
  # PASOS
      - Verificar los Requisitos del sistema operativo
      - Desinstala las versiones antiguas (SUPERUSUARIO)
                apt remove $(dpkg --get-selections docker.io docker-compose docker-doc podman-docker containerd runc | cut -f1)
      - Métodos de instalación
        -- Instalar usando el apt repositorio (SUPERUSUARIO) --
            PRIMER PASO. Configura apt el repositorio de Docker
              # Add Docker's official GPG key:
                apt update
                apt install ca-certificates curl
                install -m 0755 -d /etc/apt/keyrings
                curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
                chmod a+r /etc/apt/keyrings/docker.asc

              # Add the repository to Apt sources: (VA TODO JUNTO)
                tee /etc/apt/sources.list.d/docker.sources <<EOF
                Types: deb
                URIs: https://download.docker.com/linux/debian
                Suites: $(. /etc/os-release && echo "$VERSION_CODENAME")
                Components: stable
                Architectures: $(dpkg --print-architecture)
                Signed-By: /etc/apt/keyrings/docker.asc
                EOF

                apt update
            SEGUNDO PASO. Instala los paquetes de Docker
                apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
      - Tras la instalación, verifique que Docker se esté ejecutando
          systemctl status docker 
      - Si Docker no se está ejecutando, inícielo manualmente
          systemctl start docker
      - Verifique que la instalación se haya realizado correctamente ejecutando la hello-worldimagen
          docker run hello-world

# 3. Agregar tu usuario al grupo docker (entrar a SUPERUSUSARIO con "su -" ya que si hacemos solo "su" sin el guión no se cargan las rutas de administración (/usr/sbin))
  LINK --->  https://docs.docker.com/engine/install/linux-postinstall/
    su -
    usermod -aG docker baal
  # SALIR DE SU -, PARA CONTINUAR
    exit
    newgrp docker
  # PRUEBA
    docker ps

# 4. INSTALAR GIT EN DEBIAN (PARA CLONAR REPOSITORIOS)
    apt install git -y
  # Generar un Token en GitHub (Desde tu Windows)
      Como la terminal te pedirá una contraseña, debes usar un Token:
          - Ve a tu GitHub en el navegador: Settings > Developer Settings > Personal access tokens > Tokens (classic).
          - Haz clic en Generate new token (classic).
          - Dale un nombre (ej. "Debian-Server") y marca la casilla repo (esto da acceso a tus repositorios privados).
          - Copia el token y guárdalo bien, porque no volverás a verlo.
  # Clonar el Repositorio
      git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git
          Cuando te pida credenciales:
          - Username: Tu nombre de usuario de GitHub.
          - Password: Pega el Token que generaste en el paso anterior (no verás caracteres mientras pegas, es normal).

# 5. SOBRE EL HARDWARE
  - Verificar la ruta del lector de barras
      Conecta el lector y verifica que aparezca en /dev/input/by-id/ con el nombre exacto que tiene en scanner_bridge.py
  - Crear regla udev para el lector
      En lugar de correr el script como root, investiga cómo crear una regla en /etc/udev/rules.d/ que le dé permisos al grupo input sobre ese dispositivo USB específico. Luego agrega tu usuario baal a ese grupo.
      -- PASOS --
      1. Obtener los IDs del dispositivo:
          Para configurar el lector sin usar root, necesitamos identificar los IDs de fabricante (vendor) y producto (product) del
          dispositivo y luego crear la regla.
                  udevadm info -a -n /dev/input/by-id/usb-0581_011c-event-kbd | grep -E "idVendor|idProduct" | head -n 2
          Verás algo como: ATTRS{idVendor}=="0581" y ATTRS{idProduct}=="011c".
      2. Crear la regla udev:
          Como root (usa su -), crea el archivo de reglas:
                  nano /etc/udev/rules.d/99-lector-usb.rules
          Pega la siguiente línea (ajusta los números si los tuyos fueron distintos en el paso 1):
                  SUBSYSTEM=="input", ATTRS{idVendor}=="0581", ATTRS{idProduct}=="011c", MODE="0660", GROUP="input"
      3. Agregar tu usuario al grupo input:
          Aún como root, dale permiso a tu usuario para acceder a dispositivos de entrada:
                  usermod -aG input baal
      4. Aplicar los cambios:
          Para que el sistema reconozca la regla y el nuevo grupo sin reiniciar:
          4.1. Recargar reglas:
                  udevadm control --reload-rules && udevadm trigger
          4.2. Desconecta y vuelve a conectar el lector USB
          4.3. Actualizar grupo en la sesión actual (como usuario baal): (SIN SUPERUSUARIO)
                  newgrp input
      5. Verificación final
          Siendo el usuario baal, intenta leer el dispositivo:
                  cat /dev/input/by-id/usb-0581_011c-event-kbd
          (Si al pasar una tarjeta o código salen caracteres extraños en la terminal, ¡ya tienes permiso directo! Presiona Ctrl+C para salir).
  - Crear entorno virtual Python (venv)
      En Debian moderno no puedes hacer pip install global. Investiga cómo crear un venv en una carpeta fija (por ejemplo /home/baal/scanner-env/) e instalar evdev y requests dentro de él.
      # PASOS EN CONSOLA
              # Como root (su -)
                  apt update
                  apt install python3-venv python3-pip
              # Como tu usuario normal (baal): Crea la carpeta y el entorno en la ruta fija
                  python3 -m venv /home/baal/scanner-env/
              # Activa el entorno
                  source /home/baal/scanner-env/bin/activate
              # Ahora el prompt mostrará (scanner-env). Instala las librerías:
                  pip install evdev requests
# 6. Automatización con Systemd
      GNU nano 8.4                           /etc/systemd/system/sistema-backend.service
      ------------------------------------------------------------------------------
                    [Unit]
                    Description=NestJS Inventory Docker Service
                    After=docker.service network-online.target
                    Requires=docker.service network-online.target
                    PartOf=docker.service

                    [Service]
                    WorkingDirectory=/home/baal/Debian-LocalSystem
                    # Cambiamos 'up --build' por solo 'up' para arrancar más rápido en el boot
                    ExecStart=/usr/bin/docker compose up
                    ExecStop=/usr/bin/docker compose down
                    Restart=always
                    # Crucial: Esperar 10 segundos antes de cada reintento
                    RestartSec=10
                    User=baal
                    Group=docker

                    [Install]
                    WantedBy=multi-user.target
      ------------------------------------------------------------------------------
            # Recargar systemd para que vea el nuevo servicio
            systemctl daemon-reload

            # Habilitar para que inicie solo al arrancar el PC
            systemctl enable sistema-backend.service

            # Iniciar el servicio ahora mismo
            systemctl start sistema-backend.service

      GNU nano 8.4                            /etc/systemd/system/lector-barras.service *                  
      ------------------------------------------------------------------------------                 
                    [Unit]
                    Description=Python Scanner Bridge
                    After=sistema-backend.service
                    BindsTo=sistema-backend.service

                    [Service]
                    ExecStart=/home/baal/scanner-env/bin/python3 /home/baal/Debian-LocalSystem/scanner_bridge.py
                    WorkingDirectory=/home/baal/Debian-LocalSystem
                    Restart=always
                    # Esperar para que NestJS tenga tiempo de abrir el puerto 3006
                    RestartSec=15
                    User=baal
                    Group=input

                    [Install]
                    WantedBy=multi-user.target
      ------------------------------------------------------------------------------
            systemctl daemon-reload
            systemctl enable lector-barras.service
            systemctl start lector-barras.service

# VERIFICAR QUE ESTEN ENCENDIDOS
      systemctl status sistema-backend.service lector-barras.service

# LEVANTAR EL REPOSITORIO
      cd TU_REPOSITORIO
      docker compose up -d --build


