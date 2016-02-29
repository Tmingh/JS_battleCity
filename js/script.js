
var canvas = document.getElementById('map'),
    context = canvas.getContext('2d');

function inherit(Child, Parent) {
    var F = function(){};
    F.prototype = Parent.prototype;
    Child.prototype = new F();
    Child.prototype.constructor = Child;
}

//载入图片类
var imageLoader = function() {
    this.images = {};
    this.imageUrls = [];
    this.imagesLoaded = 0;
    this.imagesFailedToLoad = 0;
    this.imageIndex = 0;
};

imageLoader.prototype = {
    getImage: function(imageUrl) {
        return this.images[imageUrl];
    },

    imageLoadedCallback: function(e) {
        this.imagesLoaded++;
    },

    imageLoadErrorCallback: function(e) {
        this.imagesFailedToLoad++;
    },

    loadImage: function(imageUrl) {
        var image =new Image(),
            that = this;

        image.src = imageUrl;

        image.addEventListener('load',
            function(e){
                that.imageLoadedCallback(e);
            }, false
        );

        image.addEventListener('error',
            function(e) {
                that.imageLoadErrorCallback(e);
            }, false
        );

        this.images[imageUrl] = image;
    },

    loadImages: function() {
        while (this.imageIndex < this.imageUrls.length) {
            this.loadImage( this.imageUrls[this.imageIndex] );
            this.imageIndex++;
        }

        return (this.imagesLoaded + this.imagesFailedToLoad) / this.imageUrls.length * 100
    }
};
//坦克公用类
var Tank = function(props) {
    this.dir = props.dir || 'up';
    this.x = props.x || 0;
    this.y = props.y || 0;
    this.w = 30;
    this.h = 30;
    this.speed = 5;
    this.images = new imageLoader();
    this.images.imageUrls = props.url || [];
    this.collisionState = 0;
    this.dirState = {
        up: 0,
        down: 0,
        left: 0,
        right: 0
    };
};

Tank.prototype = {
    setDirection: function(dir) {
        var index = 0;
        switch (dir) {
            case 'up':
                index = 0;
                break;
            case 'down':
                index = 1;
                break;
            case 'left':
                index = 2;
                break;
            case 'right':
                index = 3;
                break;
        }
        var url = this.images.imageUrls[index];
        var image = this.images.getImage(url);
        context.drawImage(image, this.x, this.y, this.w, this.h);
    },

    init: function(index) {
        this.images.loadImages();
        this.setDirection(index);
    },

    move: function() {
        if (this.dirState['up'] == 1 && this.dir == 'up') {
            this.y -= this.speed;
        }
        if (this.dirState['down'] == 1 && this.dir == 'down') {
            this.y += this.speed;
        }
        if (this.dirState['left'] == 1 && this.dir == 'left') {
            this.x -= this.speed;
        }
        if (this.dirState['right'] == 1 && this.dir == 'right') {
            this.x += this.speed;
        }
    },

    detectCollision: function() {
        if (this.x <= 0 && this.dir == 'left') {
            this.collisionState = 1;
        }
        if (this.x >= canvas.clientWidth-this.w && this.dir == 'right') {
            this.collisionState = 1;
        }
        if (this.y <= 0 && this.dir == 'up') {
            this.collisionState = 1;
        }
        if (this.y >= canvas.clientHeight-this.h && this.dir == 'down') {
            this.collisionState = 1;
        }
    },

    detectStop: function() {
        this.detectCollision();
        if (this.collisionState != 0) {
            this.dirState[this.dir] = 0;
            this.collisionState = 0;
        }
    }
};

//子弹公用类
var Bullet = function(props) {
    this.dir= props.dir || 'up';
    this.x = props.x || 0;
    this.y = props.y || 0;
    this.w = 8;
    this.h = 8;
    this.speed = 10;
    this.bulletState = 0;
    this.blastReason = 0;
    this.blastState = 0;
    this.images = new imageLoader();
    this.images.imageUrls = props.url || [];
};

Bullet.prototype = {
    init: function() {
        this.images.loadImages();
    },

    move: function() {
        context.clearRect(this.x, this.y, this.w, this.h);
        switch (this.dir) {
            case 'up':
                this.y -= this.speed;
                break;
            case 'down':
                this.y += this.speed;
                break;
            case 'left':
                this.x -= this.speed;
                break;
            case 'right':
                this.x += this.speed;
                break;
        }
        this.setBullet();
    },

    setBullet: function() {
        var url = this.images.imageUrls[0];
        var image = this.images.getImage(url);
        context.drawImage(image, this.x, this.y, this.w, this.h);
    },

    fire: function(dir, x, y, w, h) {
        this.init();
        this.dir = dir;
        switch (this.dir) {
            case 'up':
                this.x = x + (w - this.w) / 2;
                this.y = y - this.h;
                break;
            case 'down':
                this.x = x + (w - this.w) / 2;
                this.y = y + h;
                break;
            case 'left':
                this.x = x - this.w;
                this.y = y + (h - this.h) / 2;
                break;
            case 'right':
                this.x = x + w;
                this.y = y + (h - this.h) / 2;
        }

    }
};

//主角子弹类
var HeroBullet = function(props) {
    Bullet.call(this, props);
};
inherit(HeroBullet, Bullet);

//enemy bullet
var EnemyBullet = function(props) {
    Bullet.call(this, props);
};
inherit(EnemyBullet, Bullet);


//主角类
var Hero = function(props) {
    Tank.call(this, props);
    this.bullet = new HeroBullet(
        {
            url: ['./image/tankmissile.gif']
        }
    );
};
inherit(Hero, Tank);

Hero.prototype.actions = function() {
    this.detectStop();
    this.move();

    if (this.bullet.bulletState == 1 && this.bullet.blastState == 0) {
        this.bullet.fire(this.dir, this.x, this.y, this.w, this.h);
        this.bullet.bulletState = 2;
        this.bullet.blastState = 1;
    }
    if (this.bullet.bulletState == 2) {
        this.bullet.move();
        if (this.bullet.x >= canvas.offsetWidth || this.bullet.x <= 0 ||
            this.bullet.y >= canvas.offsetHeight || this.bullet.y <= 0) {
            this.bullet.bulletState = 0;
            this.bullet.blastState = 0;
        }
    }

    this.setDirection( this.dir );

};

//敌方炮灰类
var Enemy = function(props) {
    Tank.call(this, props);
    this.dir = 'down';
    this.dirQueue = ['up', 'down', 'left', 'right'];
    this.bullets = new Array(5);
    for (var i = 0; i < 5; i++) {
        this.bullets[i] = new EnemyBullet(
            {
                url: ['./image/enemymissile.gif']
            }
        );
    }
};
inherit(Enemy, Tank);

Enemy.prototype.actions = function() {
    this.dirState[ this.dir ] = 1;
    this.detectCollision();
    if (this.collisionState == 0) {
        this.move();
    }
    if (this.collisionState != 0) {
        this.dirState[ this.dir ] = 0;
        var dirNum = Math.floor(Math.random()*4);
        while (this.dirQueue[dirNum] == this.dir) {
            dirNum = Math.floor(Math.random()*4);
        }
        console.log(this.dirQueue[dirNum]);
        this.dir = this.dirQueue[dirNum];
        this.collisionState = 0;
        this.dirState[ this.dir ] = 1;
    }

    this.setDirection( this.dir );
};


var enemy = new Enemy({
    x : 10,
    y : 10,
    url: [
        './image/enemy1U.gif',
        './image/enemy1D.gif',
        './image/enemy1L.gif',
        './image/enemy1R.gif'
    ]
});

var hero = new Hero({
    x: 200,
    y: 500,
    url: [
        './image/p1tankU.gif',
        './image/p1tankD.gif',
        './image/p1tankL.gif',
        './image/p1tankR.gif'
    ]
});

document.addEventListener('keydown', function(e) {
    var key = e.keyCode;
    if (key == 87) {
        hero.dirState['up'] = 1;
        hero.dir = 'up';
    }
    if (key == 83) {
        hero.dirState['down'] = 1;
        hero.dir = 'down';
    }
    if (key == 65) {
        hero.dirState['left'] = 1;
        hero.dir = 'left';
    }
    if (key == 68) {
        hero.dirState['right'] = 1;
        hero.dir = 'right';
    }
    if (key == 75 && hero.bullet.blastState == 0) {
        hero.bullet.bulletState = 1;
    }
});

document.addEventListener('keyup', function(e) {
    var event = e || window.event;
    var key = event.keyCode;
    if (key == 87) {
        hero.dirState['up'] = 0;
    }
    if (key == 83) {
        hero.dirState['down'] = 0;
    }
    if (key == 65) {
        hero.dirState['left'] = 0;
    }
    if (key == 68) {
        hero.dirState['right'] = 0;
    }
});

function play() {
    context.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    hero.actions();
    enemy.actions();
}

window.addEventListener('load', function(e) {
    hero.init(0);
    enemy.init(1);
    setInterval('play()', 33);
});
