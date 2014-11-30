(function () {
    "use strict";

    //a inner module
    var CollisionDetect = (function () {
        "use strict";

        var CollisionDetect = function(nodes, collision_callback, options){
            options = options || {detect:false, maxDepth:5, maxChildren:5};

            var bounds = this.computeBounds(nodes);
            this.quad = new QuadTree(bounds, false, options.maxDepth, options.maxChildren);
            this.collision_callback = collision_callback;

            for(var i=0; i<nodes.length; i++){
                var node = nodes[i];
                this.quad.insert(node);
            }
            if(options.detect){
                this.detectAll();
            }
        }

        CollisionDetect.prototype.detectAll = function() {
            var has_collision = false;
            for(var i=0; i<nodes.length; i++){
                var node = nodes[i];
                var items = this.quad.retrieve(node);
                for(var j=0; j<items.length; j++){
                    var collision_item = items[j];
                    if(collision_item !== node){
                        this.collision_callback(node, collision_item);
                        if(!node.fixed && !collision_item.fixed){
                            has_collision = true;
                        }
                    }
                }
            }
            return has_collision;
        };

        CollisionDetect.prototype.computeBounds = function(nodes){
            var i=-1, n=nodes.length, x1, y1, x2, y2, p;
            x1 = y1 = Infinity;
            x2 = y2 = -Infinity;

            // Compute bounds.
            while (++i < n) {
                p = nodes[i];
                if (p.x < x1) x1 = p.x;
                if (p.y < y1) y1 = p.y;
                if (p.x > x2) x2 = p.x;
                if (p.y > y2) y2 = p.y;

                if (p.x + p.width  < x1) x1 = p.x + p.width;
                if (p.y + p.height < y1) y1 = p.y + p.height;
                if (p.x + p.width  > x2) x2 = p.x + p.width;
                if (p.y + p.height > y2) y2 = p.y + p.height;
            }


            var bounds = {x:x1, y:y1, width:x2-x1, height:y2-y1};
            return bounds;
        }
        return CollisionDetect;

    }());

    //the exported module
    d3.layout.no_collision_force = function(options){
        var options = options || {
            layout_for:"rect",
            maxDepth:5,
            maxChildren:5,
            redrawCallback:null,
            stopTickWhenNoCollision:true
        };
        if(options.layout_for !== "rect" && options.layout_for !== "circle"){
            throw "options.layout_for must be set with rect or circle";
        }
        var no_collision_force = d3.layout.force();
        no_collision_force.on("tick", function(e) {
            var collision_callback = options.layout_for === "rect" ? rect_collision_callback : circle_collision_callback;
            var collision_detect = new CollisionDetect(nodes, collision_callback, options);
            no_collision_force.hasCollision = collision_detect.detectAll();

            if(options.redrawCallback){
                options.redrawCallback(options.layout_for);
            }
        });

        /*var tick_num = 0;
        no_collision_force.on("start", function(e) {
            tick_num = 0;
        });

        var old_tick = no_collision_force.tick;
        no_collision_force.tick = function(){
            var result = old_tick();
            tick_num++;
            if(options.stopTickWhenNoCollision && !no_collision_force.hasCollision){
                console.log("no collision now, tick_num= " + tick_num);
                return true;
            }
            else{
                return result;
            }
        }*/

        return no_collision_force;
    };

    function rect_collision_callback(node1, node2) {
        var nx1 = node1.x,
            nx2 = node1.x + node1.width,
            ny1 = node1.y,
            ny2 = node1.y + node1.height;
        if (node1 !== node2) {
            var x1 = node2.x,
                x2 = node2.x + node2.width,
                y1 = node2.y,
                y2 = node2.y + node2.height;

            if (Math.max(nx1, x1) < Math.min(nx2, x2) && Math.max(ny1, y1) < Math.min(ny2, y2))//intersects
            {
                var a = nx2 - x1,
                    b = x2 - nx1,
                    c = ny2 - y1,
                    d = y2 - ny1;
                var min = Math.min(a, b, c, d);
                if (min < 0) {
                    var tt = 0;
                }
                if (a == min) {
                    node1.x -= min *= 0.5;
                    node2.x += min;
                }
                else if (b == min) {
                    node1.x += min *= 0.5;
                    node2.x -= min;
                }
                else if (c == min) {
                    node1.y -= min *= 0.5;
                    node2.y += min;
                }
                else if (d == min) {
                    node1.y += min *= 0.5;
                    node2.y -= min;
                }
                else {
                    var tt2 = 0;
                }
                console.log("translate: " + min);
            }
        }
    }

    function circle_collision_callback(node1, node2) {
        var x = node1.x - node2.x,
            y = node1.y - node2.y,
            l = Math.sqrt(x * x + y * y),
            r = node1.radius + node2.radius;
        if (l < r) {
            l = (l - r) / l * 0.5;
            node1.x -= x *= l;
            node1.y -= y *= l;
            node2.x += x;
            node2.y += y;
        }
    }

}());