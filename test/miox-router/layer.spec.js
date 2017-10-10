import MiddleWare from 'miox/miox_modules/middleware';
import Router from 'miox-router';
import Layer from 'miox-router/layer';

describe('Layer', () => {

  it('composes multiple callbacks/middlware', () => {
    const app = new MiddleWare();
    const router = new Router();
    let status;
    app.req = {
      pathname: '/programming/how-to-node'
    }
    app.use(router.routes());
    router.patch(
      '/:category/:title',
      async (ctx, next) => {
        status = 500;
        await next();
      },
      async (ctx, next) => {
        status = 204;
        await next();
      }
    );
    app.__defineProcessHandle__();
    app.execute(app);

    expect(app.params.category).toEqual('programming');
    expect(app.params.title).toEqual('how-to-node');
    expect(status).toEqual(204);
  });

  describe('Layer#match()', () => {
    it('captures URL path parameters', () => {
      const app = new MiddleWare();
      const router = new Router();
      app.req = {
        pathname: '/programming/how-to-node'
      }
      app.use(router.routes());
      router.patch('/:category/:title', async (ctx, next) => {
        expect(!!ctx.params).toBe(true);
        expect(typeof ctx.params).toBe('object');
        expect(ctx.params.category).toEqual('programming');
        expect(ctx.params.title).toEqual('how-to-node');
      });
      app.__defineProcessHandle__();
      app.execute(app);
    });

    it('return orginal path parameters when decodeURIComponent throw error', () => {
      const app = new MiddleWare();
      const router = new Router();
      let status;
      app.req = {
        pathname: '/100%/101%'
      }
      app.use(router.routes());
      router.patch('/:category/:title', async (ctx, next) => {
        expect(ctx.params.category).toEqual('100%');
        expect(ctx.params.title).toEqual('101%');
        status = 204;
      });
      app.__defineProcessHandle__();
      app.execute(app);
      expect(status).toEqual(204);
    });

    it('populates ctx.captures with regexp captures', () => {
      const app = new MiddleWare();
      const router = new Router();
      let status;
      app.req = {
        pathname: '/api/1'
      }
      app.use(router.routes());
      router.patch(/^\/api\/([^\/]+)\/?/i, async (ctx, next) => {
        expect(!!ctx.captures).toBe(true);
        expect(ctx.captures instanceof Array).toBe(true);
        expect(ctx.captures[0]).toEqual('1');
        status = 500;
        await next();
      }, async (ctx, next) => {
        expect(!!ctx.captures).toBe(true);
        expect(ctx.captures instanceof Array).toBe(true);
        expect(ctx.captures[0]).toEqual('1');
        status = 204;
      });
      app.__defineProcessHandle__();
      app.execute(app);
      expect(status).toEqual(204);
    });

    it('return orginal ctx.captures when decodeURIComponent throw error', () => {
      const app = new MiddleWare();
      const router = new Router();
      let status;
      app.req = {
        pathname: '/api/101%'
      }
      app.use(router.routes());
      router.patch(/^\/api\/([^\/]+)\/?/i, async (ctx, next) => {
        expect(!!ctx.captures).toBe(true);
        expect(typeof ctx.captures).toBe('object');
        expect(ctx.captures[0]).toEqual('101%');
        await next();
      }, async (ctx, next) => {
        expect(!!ctx.captures).toBe(true);
        expect(typeof ctx.captures).toBe('object');
        expect(ctx.captures[0]).toEqual('101%');
        status = 204;
      });
      app.__defineProcessHandle__();
      app.execute(app);
      expect(status).toEqual(204);
    });

    it('populates ctx.captures with regexp captures include undefiend', () => {
      const app = new MiddleWare();
      const router = new Router();
      let status;
      app.req = {
        pathname: '/api'
      }
      app.use(router.routes());
      router.patch(/^\/api(\/.+)?/i, async (ctx, next) => {
        expect(!!ctx.captures).toBe(true);
        expect(typeof ctx.captures).toBe('object');
        expect(ctx.captures[0]).toEqual(undefined);
        await next();
      }, async (ctx, next) => {
        expect(!!ctx.captures).toBe(true);
        expect(typeof ctx.captures).toBe('object');
        expect(ctx.captures[0]).toEqual(undefined);
        status = 204;
      });
      app.__defineProcessHandle__();
      app.execute(app);
      expect(status).toEqual(204);
    });

    it('should throw friendly error message when handle not exists', () => {
      const app = new MiddleWare();
      const router = new Router();
      app.use(router.routes());
      var notexistHandle = undefined;
      expect(function() {
        router.patch('/foo', notexistHandle);
      }).toThrowError('patch `/foo`: `middleware` must be a function, not `undefined`')

      expect(function() {
        router.patch('foo router', '/foo', notexistHandle);
      }).toThrowError('patch `foo router`: `middleware` must be a function, not `undefined`')

      expect(function() {
        router.patch('/foo', function() {}, notexistHandle);
      }).toThrowError('patch `/foo`: `middleware` must be a function, not `undefined`')
    });
  });

  // describe('Layer#param()', () => {
    // it('composes middleware for param fn', () => {
    //   const app = new MiddleWare();
    //   const router = new Router();
    //   let status;
    //   app.req = {
    //     pathname: '/users/3'
    //   }
    //   app.use(router.routes());
    //   router.param('user', async function(id, next) {
    //     this.user = { name: 'alex', id };
    //     if (!id) return status = 404;
    //     await next();
    //   });
    //   router.patch('/users/:user', async ctx => {
    //     expect(ctx.user.name).toBe('alex');
    //     expect(ctx.user.id).toBe('3');
    //     status = 204;
    //   });
    //   app.__defineProcessHandle__();
    //   app.execute(app);
    //   expect(status).toEqual(204);
    // });

    // it('ignores params which are not matched', function(done) {
    //   var app = koa();
    //   var router = new Router();
    //   var route = new Layer('/users/:user', ['GET'], [function *(next) {
    //     this.body = this.user;
    //   }]);
    //   route.param('user', function *(id, next) {
    //     this.user = { name: 'alex' };
    //     if (!id) return this.status = 404;
    //     yield next;
    //   });
    //   route.param('title', function *(id, next) {
    //     this.user = { name: 'mark' };
    //     if (!id) return this.status = 404;
    //     yield next;
    //   });
    //   router.stack.push(route);
    //   app.use(router.middleware());
    //   request(http.createServer(app.callback()))
    //     .get('/users/3')
    //     .expect(200)
    //     .end(function(err, res) {
    //       if (err) return done(err);
    //       res.should.have.property('body');
    //       res.body.should.have.property('name', 'alex');
    //       done();
    //     });
    // });
  // });

  // describe('Layer#url()', function() {
  //   it('generates route URL', function() {
  //     var route = new Layer('/:category/:title', ['get'], [function* () {}], 'books');
  //     var url = route.url({ category: 'programming', title: 'how-to-node' });
  //     url.should.equal('/programming/how-to-node');
  //     url = route.url('programming', 'how-to-node');
  //     url.should.equal('/programming/how-to-node');
  //   });

  //   it('escapes using encodeURIComponent()', function() {
  //     var route = new Layer('/:category/:title', ['get'], [function *() {}], 'books');
  //     var url = route.url({ category: 'programming', title: 'how to node' });
  //     url.should.equal('/programming/how%20to%20node');
  //   });
  // });
});