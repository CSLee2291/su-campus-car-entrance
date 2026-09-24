const photos=[
 ["6729","右側排風箱近景","磚砌街側立面、平頂蓋、朝車道的內側百葉，以及後方停車計數器。"],
 ["6730","左側排風箱近景","左箱內側百葉、頂蓋、前方第一棵行道樹與石材樹穴。"],
 ["6731","從左側看入口","兩座排風箱與下降坡道的相對關係；左樹幹、枝葉可能影響視線。"],
 ["6732","從右側看入口","入口右側樹穴、較疏的枝葉與路緣前成對防撞柱。"],
 ["6733","入口與立面全景","紅磚及灰色飾帶、兩側百葉、地磚深色帶、減速設施與路側排水。"],
];
export function EntrancePhotos(){return <div className="photo-grid reference-photos latest-photos">{photos.map(([id,title,caption])=><figure key={id}><a href={`/photos/IMG_${id}.jpeg`} target="_blank" rel="noreferrer"><img className="street-photo" loading="lazy" src={`/photos/IMG_${id}.jpeg`} alt={title+"："+caption}/></a><figcaption><b>{title}</b><span>{caption} 點圖開啟完整照片。</span></figcaption></figure>)}</div>}
