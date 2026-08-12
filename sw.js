const CACHE = 'jl-sw-v2';
const timers = [];

// 12条经络数据
const MERIDIANS = [
  {name:'胆经', code:'9993809', shi:'子时', startH:23, url:'https://mp.weixin.qq.com/s/aSt6N6F7kDQh5p-qtGKRyw'},
  {name:'肝经', code:'9993909', shi:'丑时', startH:1,  url:'https://mp.weixin.qq.com/s/E8j7we4PjKz0QYDc-rus3g'},
  {name:'肺经', code:'9994509', shi:'寅时', startH:3,  url:'https://mp.weixin.qq.com/s/If2L3GMmI0dPYI60Yzil3w'},
  {name:'大肠经',code:'9994609', shi:'卯时', startH:5,  url:'https://mp.weixin.qq.com/s/vgO2GN0TyvPI_WitIQxi1A'},
  {name:'胃经', code:'9994409', shi:'辰时', startH:7,  url:'https://mp.weixin.qq.com/s/7wUeewzH-dsu88hh-wWSOw'},
  {name:'脾经', code:'9994309', shi:'巳时', startH:9,  url:'https://mp.weixin.qq.com/s/eV1hXc4pG_XrMWehH1t47A'},
  {name:'心经', code:'9994109', shi:'午时', startH:11, url:'https://mp.weixin.qq.com/s/EjIKEY49T6kYalxD20PWzw'},
  {name:'小肠经',code:'9994709', shi:'未时', startH:13, url:'https://mp.weixin.qq.com/s/C9K9K_QFzRz9iQPvxmV1zw'},
  {name:'膀胱经',code:'9994809', shi:'申时', startH:15, url:'https://mp.weixin.qq.com/s/qXNNP-HgT5G5FrtBUzrdLA'},
  {name:'肾经', code:'9995109', shi:'酉时', startH:17, url:'https://mp.weixin.qq.com/s/GHrqZKC0r7HUJhsY9-HnkA'},
  {name:'心包经',code:'9994209', shi:'戌时', startH:19, url:'https://mp.weixin.qq.com/s/fNWIVAUMRQzbx0cSeVbKWg'},
  {name:'三焦经',code:'9994909', shi:'亥时', startH:21, url:'https://mp.weixin.qq.com/s/qb1wU7-iJ79WFiXl-ZjzDQ'},
];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
      .then(() => {
        // SW激活后主动调度今日通知，不依赖页面发消息
        scheduleAll();
      })
  );
});

// 点击通知打开页面
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) ||
               'https://yinyinwu06-design.github.io/meridian/';
  e.waitUntil(
    clients.matchAll({type:'window', includeUncontrolled:true}).then(cls => {
      for(const c of cls){
        if(c.url.includes('meridian') && 'focus' in c) return c.focus();
      }
      if(clients.openWindow) return clients.openWindow(url);
    })
  );
});

// 接收页面消息
self.addEventListener('message', e => {
  if(!e.data) return;
  if(e.data.type==='SKIP_WAITING'){self.skipWaiting();return;}
  if(e.data.type === 'SCHEDULE') {
    scheduleAll();
  }
  if(e.data.type === 'SCHEDULE_CUSTOM') {
    clearCustomTimers();
    e.data.notifs.forEach(n => {
      const delay = n.time - Date.now();
      if(delay > 0 && delay < 86400000){
        timers.push({
          id: setTimeout(() => {
            self.registration.showNotification(n.title, {
              body: n.body,
              tag: 'custom-' + n.h,
              renotify: true,
              requireInteraction: true,
              data: {url: n.url || 'https://yinyinwu06-design.github.io/meridian/'}
            });
          }, delay),
          type: 'custom'
        });
      }
    });
  }
});

function clearCustomTimers(){
  timers.filter(t => t.type==='custom').forEach(t => clearTimeout(t.id));
  for(let i = timers.length-1; i>=0; i--){
    if(timers[i].type==='custom') timers.splice(i,1);
  }
}

function scheduleAll(){
  // 清除旧的子午流注定时器
  timers.filter(t => t.type==='shichen').forEach(t => clearTimeout(t.id));
  for(let i = timers.length-1; i>=0; i--){
    if(timers[i].type==='shichen') timers.splice(i,1);
  }

  const now = new Date();
  let scheduled = 0;

  MERIDIANS.forEach(m => {
    const t = new Date();
    t.setHours(m.startH, 0, 0, 0);
    // 子时特殊处理
    if(m.startH === 23 && now.getHours() < 23){
      t.setHours(23, 0, 0, 0);
    }
    // 已过则推到明天
    if(t <= now) t.setDate(t.getDate() + 1);

    const delay = t.getTime() - Date.now();
    if(delay > 0 && delay < 90000000){
      timers.push({
        id: setTimeout(() => {
          self.registration.showNotification(
            `⏰ ${m.shi} · ${m.name}时辰到`,
            {
              body: `连接代码：${m.code}\n点击打开文章开始运行`,
              tag: 'shichen-' + m.startH,
              renotify: true,
              requireInteraction: false,
              data: {url: m.url}
            }
          );
          // 通知发出后重新调度明天同一时辰
          setTimeout(() => scheduleAll(), 5000);
        }, delay),
        type: 'shichen'
      });
      scheduled++;
    }
  });
  console.log(`[SW] 已调度 ${scheduled} 个时辰通知`);
}
