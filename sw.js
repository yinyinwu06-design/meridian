const timers=[];
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const url=e.notification.data&&e.notification.data.url;
  e.waitUntil(clients.matchAll({type:'window'}).then(cls=>{
    for(const c of cls){if('focus' in c)return c.focus();}
    if(url&&clients.openWindow)return clients.openWindow(url);
  }));
});
self.addEventListener('message',e=>{
  if(!e.data)return;
  if(e.data.type==='SCHEDULE'){
    timers.forEach(t=>clearTimeout(t));timers.length=0;
    e.data.notifs.forEach(n=>{
      const delay=n.time-Date.now();
      if(delay>0&&delay<90000000){
        timers.push(setTimeout(()=>{
          self.registration.showNotification(n.title,{
            body:n.body,icon:n.icon,tag:'jl-'+n.h,
            renotify:true,requireInteraction:false,
            data:{url:n.url}
          });
        },delay));
      }
    });
  }
  if(e.data.type==='SCHEDULE_CUSTOM'){
    timers.filter((_,i)=>i>=12).forEach(t=>clearTimeout(t));
    e.data.notifs.forEach(n=>{
      const delay=n.time-Date.now();
      if(delay>0&&delay<86400000){
        timers.push(setTimeout(()=>{
          self.registration.showNotification(n.title,{
            body:n.body,icon:n.icon||'',tag:'custom-'+n.h,
            renotify:true,requireInteraction:true,
            data:{url:n.url}
          });
        },delay));
      }
    });
  }
});
