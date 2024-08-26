async function startCamera() {
    const videoElement = document.getElementById('video');

    try {
        // Solicitar permiso para acceder a la cámara
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });

        // Asignar el stream al elemento de video
        videoElement.srcObject = stream;
    } catch (error) {
        console.error('Error al acceder a la cámara: ', error);
        alert('No se pudo acceder a la cámara. Asegúrate de que el navegador tenga permisos para acceder a ella.');
    }
}

// Acceso al video y canvas
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

// Cargar la cámara
async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: true
    });
    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

// Cargar el modelo Coco-SSD y empezar la detección
async function startDetection() {
    const model = await cocoSsd.load();
    console.log('Modelo cargado');

    // Empezar a detectar
    detectFrame(video, model);
}

// Función para detectar en cada frame del video
function detectFrame(video, model) {
    model.detect(video).then(predictions => {
        // Limpiar el canvas antes de dibujar
        context.clearRect(0, 0, canvas.width, canvas.height);

        // Dibujar el video en el canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Dibujar las predicciones
        predictions.forEach(prediction => {
            const [x, y, width, height] = prediction.bbox;
            context.strokeStyle = "#00FF00";
            context.lineWidth = 4;
            context.strokeRect(x, y, width, height);
            context.font = "18px Arial";
            context.fillStyle = "#000";
            context.fillText(
                `${prediction.class} (${Math.round(prediction.score * 100)}%)`,
                x,
                y > 10 ? y - 5 : 10
            );
        });

        // Llamar la función para el siguiente frame
        requestAnimationFrame(() => {
            detectFrame(video, model);
        });
    });
}

// Iniciar el video y detección
setupCamera().then(() => {
    video.play();
    startDetection();
});
