const theVideo = document.getElementById('video');

navigator.getMedia =
    navigator.getUserMedia ||
    navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia;

    
    const loadCamera = () => {
        console.log(12);
        navigator.getMedia(
            // Restricciones (contraints) *Requerido
            {
                video: true,
                audio: false,
            },
                stream => theVideo.srcObject = stream,
                console.error
        );
    }

    // carga de los modelos
    Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
        console.log(' al cargar modelos ', faceapi.nets),
        faceapi.nets.ageGenderNet.loadFromUri('models'),
        faceapi.nets.faceExpressionNet.loadFromUri('models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('models'),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri('models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('models'),
        faceapi.nets.ssdMobilenetv1.loadFromUri('models'),
        faceapi.nets.tinyFaceDetector.loadFromUri('models'),
        // faceapi.nets.tinyYolov2.loadFromUri('models'),

    ]).then(loadCamera)

    // // Cargar la imagen de referencia y calcular su descriptor facial
    // const referenceImage = await faceapi.fetchImage('./images_comparation.keanu_reeves.jpg');
    // console.log(' cargado de imagen ', referenceImage);
    // const referenceDetection = await faceapi.detectSingleFace(referenceImage).withFaceLandmarks().withFaceDescriptor();

    // if (!referenceDetection) {
    //     console.error("No se pudo detectar la cara en la imagen de referencia.");
    //     return;
    // }
    // const referenceDescriptor = referenceDetection.descriptor;
    
theVideo.addEventListener('play', async () => {
    const canvas = faceapi.createCanvasFromMedia(theVideo)
    document.body.append(canvas)

    // tamaño del canvas
    const displaySize = { width: theVideo.width, height: theVideo.height }
    // resize the overlay canvas to the input dimensions
    faceapi.matchDimensions(canvas, displaySize)


    
    // const referenceImage = await faceapi.fetchImage('./images_comparation/keanu_reeves.jpg');
    const referenceImage = await faceapi.fetchImage('./images_comparation/keanu_reeves.png');
    const referenceDetection = await faceapi.detectSingleFace(referenceImage).withFaceLandmarks().withFaceDescriptor();

    if (!referenceDetection) {
        console.error("No se pudo detectar la cara en la imagen de referencia.");
        return;
    }
    const referenceDescriptor = referenceDetection.descriptor;
    const descriptorString = JSON.stringify(Array.from(referenceDescriptor));
    console.log('descriptor string => ', descriptorString);
    // console.log(' cargado de imagen ', referenceDescriptor, referenceDetection,  referenceImage);


    const intervalTime = 1000; // 1000 ms = 1 segundo
    setInterval(async() => {
        const detections = await faceapi.detectAllFaces(theVideo)
                            .withFaceLandmarks()
                            .withFaceExpressions()
                            .withAgeAndGender()
                            .withFaceDescriptors()
        // console.log(' setInteral => ', detections);
        // resize the detected boxes in case your displayed image has a different size than the original
        const resizedDetections = faceapi.resizeResults(detections, displaySize)
        // limpia lo que tiene dibujado el canvas 
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
        // draw detections into the canvas
        faceapi.draw.drawDetections(canvas, resizedDetections)
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
        const minProbability = 0.05
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections, minProbability)

        resizedDetections.forEach(detection => {
            // console.log(detection);
            const box = detection.detection.box
            new faceapi.draw.DrawBox(box, {
                label: Math.round(detection.age) + ' años ' + (detection.gender=='male'? 'masculino': detection.gender)
            }).draw(canvas)

            const distance = faceapi.euclideanDistance(referenceDescriptor, detection.descriptor);
            if (distance < 0.6) {  // Umbral típico para considerar una coincidencia
                console.log("Persona identificada:", detection);
                const box = detection.detection.box;
                new faceapi.draw.DrawBox(box, {
                    label: "Persona identificada"
                }).draw(canvas);
            } else {
                const box = detection.detection.box;
                new faceapi.draw.DrawBox(box, {
                    label: "Persona no identificada"
                }).draw(canvas);
            }
        });
    }, intervalTime)
})

