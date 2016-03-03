
var canvas = document.getElementById('map'),
    context = canvas.getContext('2d'),
    UnitWidth = 30,
    UnitHeight = 30;

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

var Walls = function(props) {
    this.images = new imageLoader();
    this.images.imageUrls = props.urls || [];
    this.wallPositions = props.positions || [];
    this.initialWalls = [];
    this.destoryedWalls = [];
    this.wallWidth = UnitWidth / 4;
    this.wallHeight = UnitHeight / 4;
};

Walls.prototype = {
    init: function() {
        this.images.loadImages();
        this.setImage();
        this.getInitialPositions();
    },
    setImage: function() {
        for (var i = 0; i < this.wallPositions.length; i++) {
            var wall = this.wallPositions[i];
            var url = this.images.imageUrls[wall.id];
            var image = this.images.getImage(url);

            context.drawImage(image, wall.x, wall.y, wall.w, wall.h);
        }
        this.moveDestoryedWall();
    },

    moveDestoryedWall: function() {
        for (var i = 0; i < this.destoryedWalls.length; i++) {
            var wall = this.destoryedWalls[i];
            var image = context.getImageData(wall.x, wall.y, this.wallWidth, this.wallHeight);
            for (var j = 1; j <= image.data.length; j++) {
                image.data[j*4-1] = 0;
            }

            context.putImageData(image, wall.x, wall.y);
        }
    },

    getInitialPositions: function() {
        for (var i = 0; i < this.wallPositions.length; i++) {
            var wall = this.wallPositions[i];
            if (wall.id == 0) {
                for (var j = 0; j < 4; j++) {
                    for (var k = 0; k < 4; k++) {
                        this.initialWalls.push({x: wall.x+j*this.wallWidth, y: wall.y+k*this.wallHeight});
                    }
                }
            } else if (wall.id == 1) {
                this.initialWalls.push({x: wall.x, y: wall.y});
            }
        }
        console.log(this.initialWalls);
    },

    checkDestoryed : function (wall) {
        for (var i = 0; i < this.destoryedWalls.length; i++) {
            var destoryedWall = this.destoryedWalls[i];
            if (wall.x == destoryedWall.x && wall.y == destoryedWall.y) {
                return 0;
            }
        }

        return -1;
    }

};

var walls = new Walls(
    {
        urls: ['image/walls.gif', 'image/wall.gif'],
        positions: [{id: 0, x: 100, y: 100, w: 30, h: 30},
            {id: 0, x: 200, y: 200, w: 30, h: 30}]
    }
);

//坦克公用类
var Tank = function(props) {
    this.dir = props.dir || 'up';
    this.x = props.x || 0;
    this.y = props.y || 0;
    this.w = UnitWidth;
    this.h = UnitHeight;
    this.speed = 3;
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
    var args = props || {};
    this.dir= args.dir || 'up';
    this.x = args.x || 0;
    this.y = args.y || 0;
    this.w = UnitWidth/4;
    this.h = UnitHeight/4;
    this.speed = 6;
    this.shotState = false;
    this.images = new imageLoader();
    this.images.imageUrls = args.url || [];
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

    shot: function(dir, x, y, w, h) {
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
    },

    detectBlast: function() {
        for (var i = 0; i < walls.initialWalls.length; i++) {
            var wall = walls.initialWalls[i];

            /*if (this.dir == 'up' || this.dir == 'down') {
                if ((this.x > wall.x - this.w && this.x < wall.x + UnitWidth + this.w) &&
                    (this.y <= wall.y + UnitHeight && this.y >= wall.y) &&
                    walls.checkDestoryed(wall) != 0) {
                    this.destoryWalls(wall);
                    //this.moveBullet();
                    return 'blast';
                }
            }

            if (this.dir == 'left' || this.dir == 'right') {
                if ((this.x <= wall.x + UnitWidth && this.x >= wall.x) &&
                    (this.y > wall.y - this.h && this.y < wall.y + UnitHeight + this.h) &&
                    walls.checkDestoryed(wall) != 0) {
                    this.destoryWalls(wall);
                    //this.moveBullet();
                    return 'blast';
                }
            }*/

            if ( walls.checkDestoryed(wall) != 0 &&
                this.x > wall.x-this.w &&
                this.x < wall.x+UnitWidth/4 &&
                this.y < wall.y+UnitHeight/4 &&
                this.y > wall.y-this.h ) {

                this.destoryWalls(wall);
                return 'blast';
            }

        }

        if (this.x >= canvas.clientWidth || this.x <= 0 ||
            this.y >= canvas.clientHeight || this.y <= 0) {
            return 'out';
        } else {
            this.move();
            return 'in';
        }
    },

    destoryWalls: function(wall) {
        walls.destoryedWalls.push({x: wall.x, y: wall.y});
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
    this.bulletFlag = 'wait';
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

    if (this.bulletFlag == 'shot') {
        this.bulletFlag = 'detect';
        this.bullet.shotState = true;
        this.bullet.shot(this.dir, this.x, this.y, this.w, this.h);
    }

    if (this.bulletFlag == 'detect') {
        var bulletState = this.bullet.detectBlast();
        if (bulletState != 'in') {
            this.bulletFlag = 'wait';
            this.bullet.shotState = false;
        }
    }

    this.setDirection( this.dir );

};

//敌方炮灰类
var Enemy = function(props) {
    Tank.call(this, props);
    this.dir = 'down';
    this.dirQueue = ['up', 'down', 'left', 'right'];
    this.bulletIndex = 0;
    this.bullets = new EnemyBullet({
        url: ['./image/enemymissile.gif']
    });/*new Array(5);
    for (var i = 0; i < 5; i++) {
        this.bullets[i] = new EnemyBullet(
            {
                url: ['./image/enemymissile.gif']
            }
        );
    }*/
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
        this.dir = this.dirQueue[dirNum];
        this.collisionState = 0;
        this.dirState[ this.dir ] = 1;
    }

    this.decideFire();

    this.setDirection( this.dir );
};

Enemy.prototype.decideFire = function() {
    var flag = Math.random();
    if (flag < 0.1 && this.bullets.shotState == false) {
        this.bullets.shot(this.dir, this.x, this.y, this.w, this.h);
        this.bullets.shotState = true;

        this.bulletIndex++;
        if (this.bulletIndex == 5) {
            this.bulletIndex = 0;
        }
    }
    //for (var i = 0; i < this.bullets.length; i++) {
    if (this.bullets.shotState == true) {
        var bulletState = this.bullets.detectBlast();
        if (bulletState != 'in') {
            this.bullets.shotState = false;
        }
    }
    //}
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
    y: 400,
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
    if (key == 75 && hero.bulletFlag == 'wait') {
        hero.bulletFlag = 'shot';
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
    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    walls.setImage();
    hero.actions();
    enemy.actions();
}

window.addEventListener('load', function(e) {
    hero.init(0);
    enemy.init(1);
    walls.init();
    setInterval('play()', 20);
});
