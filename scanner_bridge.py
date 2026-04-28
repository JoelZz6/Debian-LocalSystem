import evdev
import requests
import json

# 1. Configuración
# Debes buscar tu lector en /dev/input/by-id/ o usar /dev/input/eventX
# El comando 'ls /dev/input/by-id/' te ayudará a identificarlo
DEVICE_PATH = '/dev/input/by-id/usb-0581_011c-event-kbd'
API_URL = "http://localhost:3006/escanear"

def main():
    try:
        device = evdev.InputDevice(DEVICE_PATH)
        # Tomamos control exclusivo para que los números no se escriban en pantalla
        device.grab() 
        
        print(f"Escuchando a: {device.name}")
        barcode = ""
        
        for event in device.read_loop():
            if event.type == evdev.ecodes.EV_KEY:
                data = evdev.categorize(event)
                if data.keystate == 1:  # Tecla presionada
                    key_code = data.keycode
                    if key_code == 'KEY_ENTER':
                        # Enviar a NestJS
                        requests.post(API_URL, json={"codigo": barcode})
                        barcode = ""
                    else:
                        # Convertir KEY_1 a "1", etc.
                        char = key_code.split('_')[-1]
                        if len(char) == 1: barcode += char

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
