export const catalog = [
  { id:'suit-11', name:'The Modern Muse Suit', category:'Suits', price:89500, oldPrice:112000, image:'/images/Suit-inshot (11).jpg', rating:'4.9', reviews:38, tag:'BESTSELLER' },
  { id:'gown-9', name:'Evening in Bloom Gown', category:'Gowns', price:128000, oldPrice:160000, image:'/images/Gown.Ai (9).jpg', rating:'4.8', reviews:24, tag:'−20%' },
  { id:'summer-11', name:'Golden Hour Co-ord', category:'Two pieces', price:68500, oldPrice:0, image:'/images/Summer-inshot (11).jpg', rating:'4.7', reviews:19, tag:'NEW' },
  { id:'jumpsuit-8', name:'The Sunday Jumpsuit', category:'Jumpsuits', price:74500, oldPrice:93000, image:'/images/Jumpsuit-Inshot (8).jpg', rating:'4.9', reviews:31, tag:'−20%' },
  { id:'two-piece-7', name:'Soft Structure Set', category:'Two pieces', price:82500, oldPrice:0, image:'/images/Two-piece (7).jpg', rating:'4.8', reviews:17, tag:'' },
  { id:'suit-7', name:'After Hours Tailoring', category:'Suits', price:112000, oldPrice:140000, image:'/images/Suit-inshot (7).jpg', rating:'5.0', reviews:12, tag:'LIMITED' },
  { id:'gown-5', name:'Petal Stitch Midi', category:'Gowns', price:97500, oldPrice:0, image:'/images/Gown.Ai (5).jpg', rating:'4.6', reviews:28, tag:'' },
  { id:'collar-4', name:'The Everyday Statement', category:'Accessories', price:24500, oldPrice:31000, image:'/images/Collar (4).jpg', rating:'4.8', reviews:46, tag:'−21%' },
  { id:'jumpsuit-11', name:'City Edit Jumpsuit', category:'Jumpsuits', price:79000, oldPrice:0, image:'/images/Jumpsuit-Inshot (11).jpg', rating:'4.7', reviews:16, tag:'' },
  { id:'two-piece-3', name:'Weekend Linen Set', category:'Two pieces', price:71500, oldPrice:85000, image:'/images/Two-piece (3).jpg', rating:'4.8', reviews:21, tag:'−16%' },
  { id:'glove-3', name:'Finishing Touch Gloves', category:'Accessories', price:18000, oldPrice:0, image:'/images/Glove (3).jpg', rating:'4.5', reviews:9, tag:'NEW' },
  { id:'suit-5', name:'The Occasion Suit', category:'Suits', price:105000, oldPrice:132000, image:'/images/Suit-inshot (5).jpg', rating:'4.9', reviews:27, tag:'−20%' },
];
export const categories = ['All pieces','Gowns','Suits','Jumpsuits','Two pieces','Accessories'];
export const naira = value => `₦${Number(value || 0).toLocaleString('en-NG')}`;
