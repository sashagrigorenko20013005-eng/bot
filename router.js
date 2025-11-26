/* Simple hash-based router (SPA variant B) */
export const router = {
  routes: {},
  on(route, handler) { this.routes[route] = handler },
  navigate(path) { location.hash = path },
  current() { return location.hash || '#/' },
  start() {
    window.addEventListener('hashchange', ()=> this._resolve());
    if(!location.hash) location.hash = '#/';
    this._resolve();
  },
  _resolve() {
    const path = this.current();
    // simple match: exact path or param routes like #/service/:id
    for(const r in this.routes){
      const route = r;
      const paramNames = [];
      const regex = new RegExp('^' + route.replace(/:\\w+/g, (m)=>{ paramNames.push(m.slice(1)); return '(\\\w[\\\w-]*)' }) + '$');
      const match = path.match(regex);
      if(match){
        const params = {};
        paramNames.forEach((n,i)=> params[n]=match[i+1]);
        this.routes[r](params);
        return;
      }
    }
    // fallback to not found
    if(this.routes[path]) this.routes[path]();
  }
};
