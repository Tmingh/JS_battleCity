var canvas = document.getElementById('map'),
    context = canvas.getContext('2d'),
    image = new Image();

image.src = 'g.jpg';

image.onload = function() {
    context.drawImage(image, 0, 0, canvas.clientWidth, canvas.clientHeight);
    var temp = context.getImageData(500, 0, 50, 50);
    for (var i = 1; i <= temp.data.length / 4; i++) {
        temp.data[i*4-1] = 0;
    }
    context.putImageData(temp, 500, 0);
};