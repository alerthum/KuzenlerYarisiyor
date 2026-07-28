const COMMON_ENGLISH_RAW = [
  ['apple','elma','I eat an apple at breakfast.'],['book','kitap','This book has a funny story.'],['chair','sandalye','Please sit on the chair.'],['door','kapı','Close the door quietly.'],['family','aile','My family eats dinner together.'],
  ['friend','arkadaş','My friend helps me at school.'],['garden','bahçe','Flowers grow in the garden.'],['happy','mutlu','I feel happy today.'],['house','ev','Our house has a small balcony.'],['learn','öğrenmek','We learn something new every day.'],
  ['morning','sabah','I wake up early in the morning.'],['night','gece','The stars shine at night.'],['pencil','kurşun kalem','Write your name with a pencil.'],['school','okul','Our school starts at nine.'],['water','su','Drink enough water every day.'],
  ['animal','hayvan','The dolphin is a clever animal.'],['answer','cevap','I know the answer to the question.'],['beautiful','güzel','The rainbow looks beautiful.'],['because','çünkü','I stayed inside because it rained.'],['before','önce','Wash your hands before dinner.'],
  ['behind','arkasında','The ball is behind the box.'],['between','arasında','The library is between two shops.'],['breakfast','kahvaltı','Breakfast gives us energy.'],['brother','erkek kardeş','My brother likes football.'],['careful','dikkatli','Be careful on the wet floor.'],
  ['choose','seçmek','Choose one card from the table.'],['clean','temiz','Keep your room clean.'],['cloud','bulut','A dark cloud covered the sun.'],['country','ülke','Türkiye is a beautiful country.'],['different','farklı','The two shapes are different.'],
  ['difficult','zor','This puzzle is difficult but fun.'],['easy','kolay','The first question is easy.'],['enough','yeterli','We have enough time to finish.'],['every','her','I read every evening.'],['example','örnek','The teacher gave an example.'],
  ['favorite','favori','Blue is my favorite color.'],['finish','bitirmek','Finish your homework before playing.'],['forest','orman','Many animals live in the forest.'],['future','gelecek','I want to be a scientist in the future.'],['game','oyun','This game teaches new words.'],
  ['healthy','sağlıklı','Fruit is a healthy snack.'],['help','yardım etmek','Can you help me carry this box?'],['important','önemli','Sleep is important for learning.'],['inside','içeride','The cat is inside the house.'],['journey','yolculuk','Our train journey took three hours.'],
  ['kitchen','mutfak','We make soup in the kitchen.'],['language','dil','English is an international language.'],['library','kütüphane','I borrowed a book from the library.'],['listen','dinlemek','Listen carefully to the instructions.'],['market','market','We bought milk from the market.'],
  ['minute','dakika','Wait here for one minute.'],['mountain','dağ','Snow covered the mountain.'],['music','müzik','Music helps me relax.'],['nature','doğa','We should protect nature.'],['neighbor','komşu','Our neighbor has a friendly dog.'],
  ['outside','dışarıda','The children are playing outside.'],['picture','resim','There is a bird in the picture.'],['question','soru','Read the question twice.'],['quiet','sessiz','The classroom became quiet.'],['remember','hatırlamak','Remember to bring your notebook.'],
  ['river','nehir','The river flows through the town.'],['sister','kız kardeş','My sister can play the piano.'],['sometimes','bazen','I sometimes walk to school.'],['strong','güçlü','Exercise makes our muscles strong.'],['student','öğrenci','Every student has a different idea.'],
  ['teacher','öğretmen','The teacher explained the problem.'],['together','birlikte','We solved the puzzle together.'],['understand','anlamak','I understand the new rule.'],['village','köy','My grandparents live in a village.'],['weather','hava durumu','The weather is sunny today.'],
  ['window','pencere','Open the window for fresh air.'],['wonderful','harika','We had a wonderful day.'],['write','yazmak','Write three sentences about your day.'],['young','genç','The young tree needs water.'],['always','her zaman','I always check my answers.'],
  ['around','etrafında','We walked around the lake.'],['arrive','varmak','The bus will arrive at ten.'],['begin','başlamak','The lesson will begin soon.'],['build','inşa etmek','Birds build nests in spring.'],['carry','taşımak','I can carry this light bag.']
];

const MORE_COMMON_ENGLISH_RAW = [
  ['above','üstünde','The clock is above the door.'],['across','karşısında','The bank is across the street.'],['afraid','korkmuş','The child was afraid of the loud noise.'],['again','tekrar','Please read the sentence again.'],['air','hava','Clean air is important for health.'],
  ['almost','neredeyse','I am almost finished.'],['angry','kızgın','He felt angry but spoke calmly.'],['autumn','sonbahar','Leaves fall in autumn.'],['beach','sahil','We collected shells on the beach.'],['believe','inanmak','I believe you can solve it.'],
  ['bicycle','bisiklet','She rides her bicycle to the park.'],['blanket','battaniye','The blanket kept us warm.'],['bridge','köprü','The bridge crosses the river.'],['bright','parlak','The moon looks bright tonight.'],['calendar','takvim','Mark the date on the calendar.'],
  ['camera','kamera','I took a photo with the camera.'],['candle','mum','The candle gives a small light.'],['circle','daire','Draw a circle around the answer.'],['climb','tırmanmak','We climb the hill slowly.'],['clothes','kıyafetler','Put your clean clothes in the cupboard.'],
  ['collect','toplamak','We collect paper for recycling.'],['corner','köşe','The shop is on the corner.'],['dangerous','tehlikeli','Running on ice can be dangerous.'],['daughter','kız evlat','Their daughter loves science.'],['deep','derin','The lake is very deep.'],
  ['delicious','lezzetli','The soup smells delicious.'],['dream','rüya','I had a strange dream.'],['earth','dünya','The Earth moves around the Sun.'],['empty','boş','The bottle is empty.'],['excited','heyecanlı','We are excited about the trip.'],
  ['exercise','egzersiz','Daily exercise keeps the body active.'],['expensive','pahalı','That computer is too expensive.'],['famous','ünlü','The city is famous for its history.'],['farmer','çiftçi','The farmer grows tomatoes.'],['field','tarla','Cows are walking in the field.'],
  ['floor','zemin','Your bag is on the floor.'],['flower','çiçek','This flower needs sunlight.'],['follow','takip etmek','Follow the arrows to the exit.'],['forget','unutmak','Do not forget your keys.'],['glass','bardak','Please fill the glass with water.'],
  ['ground','yer','The ball fell to the ground.'],['grow','büyümek','Plants grow faster in spring.'],['happen','olmak','What will happen next?'],['hungry','aç','I feel hungry after practice.'],['idea','fikir','That is a creative idea.'],
  ['island','ada','The small island has no cars.'],['laugh','gülmek','The joke made everyone laugh.'],['leave','ayrılmak','We leave home at eight.'],['light','ışık','Turn on the light, please.'],['lunch','öğle yemeği','We eat lunch at school.'],
  ['machine','makine','This machine cuts paper.'],['map','harita','Use the map to find the museum.'],['moon','ay','The moon reflects sunlight.'],['move','hareket etmek','Move the chair closer.'],['museum','müze','We saw old coins in the museum.'],
  ['north','kuzey','The compass points north.'],['ocean','okyanus','Many whales live in the ocean.'],['office','ofis','My aunt works in an office.'],['opposite','karşıt','Hot and cold are opposite words.'],['parent','ebeveyn','Every parent received a message.'],
  ['peace','barış','People hope for peace.'],['planet','gezegen','Mars is a planet.'],['plant','bitki','Water the plant every two days.'],['present','hediye','This present is for you.'],['protect','korumak','Helmets protect our heads.'],
  ['quickly','hızlıca','She quickly found the answer.'],['ready','hazır','Are you ready to begin?'],['recycle','geri dönüştürmek','We recycle glass and paper.'],['right','sağ','Turn right at the traffic light.'],['season','mevsim','Winter is the coldest season.'],
  ['shadow','gölge','The tree makes a long shadow.'],['shape','şekil','A triangle is a shape.'],['slowly','yavaşça','Read the instructions slowly.'],['spring','ilkbahar','Flowers open in spring.'],['street','sokak','The street is busy in the morning.'],
  ['summer','yaz','We swim in summer.'],['surprise','sürpriz','The party was a surprise.'],['travel','seyahat etmek','We travel by train.'],['useful','yararlı','This chart is useful.'],['vegetable','sebze','Carrots are a healthy vegetable.']
];

const ADVANCED_ENGLISH_RAW = [
  ['ability','yetenek','Practice improves your ability.'],['achieve','başarmak','Small steps help us achieve big goals.'],['advantage','avantaj','Planning gives you an advantage.'],['ancient','antik','We visited an ancient city.'],['approach','yaklaşım','She tried a different approach to the problem.'],
  ['argument','tartışma','A strong argument needs evidence.'],['attempt','girişim','His first attempt did not succeed.'],['average','ortalama','The average score increased this month.'],['avoid','kaçınmak','Avoid making a decision too quickly.'],['balance','denge','A healthy life needs balance.'],
  ['behavior','davranış','Polite behavior makes teamwork easier.'],['benefit','fayda','Reading has many benefits.'],['challenge','zorluk','Every challenge can teach us something.'],['compare','karşılaştırmak','Compare the two graphs carefully.'],['complete','tamamlamak','Complete the task before the deadline.'],
  ['conclusion','sonuç','The data supports our conclusion.'],['condition','koşul','Plants grow well under the right conditions.'],['consider','düşünmek','Consider every option before choosing.'],['contain','içermek','This box contains old photographs.'],['continue','devam etmek','Continue working even when it feels hard.'],
  ['create','oluşturmak','Students create a model of the solar system.'],['curious','meraklı','A curious mind asks good questions.'],['decision','karar','It was a difficult decision.'],['decrease','azalmak','The temperature will decrease tonight.'],['describe','tanımlamak','Describe the pattern in your own words.'],
  ['develop','geliştirmek','Games can develop problem-solving skills.'],['discover','keşfetmek','Scientists discover new facts through experiments.'],['effect','etki','Lack of sleep has a negative effect.'],['efficient','verimli','This method is faster and more efficient.'],['environment','çevre','We must protect the environment.'],
  ['evidence','kanıt','The detective looked for evidence.'],['examine','incelemek','Examine the diagram before answering.'],['exist','var olmak','Some animals exist only on islands.'],['experiment','deney','The experiment tested the new idea.'],['explain','açıklamak','Explain how you found the answer.'],
  ['factor','etken','Time is an important factor.'],['feature','özellik','The phone has a useful feature.'],['focus','odaklanmak','Focus on the important information.'],['function','işlev','What is the function of the heart?'],['generate','üretmek','Solar panels generate electricity.'],
  ['increase','artmak','Regular practice can increase speed.'],['indicate','göstermek','The red line indicates a warning.'],['individual','birey','Each individual learns differently.'],['influence','etkilemek','Weather can influence travel plans.'],['investigate','araştırmak','We will investigate why the plant stopped growing.'],
  ['method','yöntem','Try another method if this one fails.'],['observe','gözlemlemek','Observe how the shadow changes.'],['occur','meydana gelmek','Earthquakes can occur without warning.'],['opportunity','fırsat','The competition is a good opportunity to learn.'],['organize','düzenlemek','Organize your notes by topic.'],
  ['particular','belirli','Pay attention to this particular detail.'],['perform','gerçekleştirmek','The machine can perform several tasks.'],['possible','mümkün','Is it possible to solve it another way?'],['predict','tahmin etmek','Can you predict the next number?'],['prevent','önlemek','Washing hands helps prevent illness.'],
  ['process','süreç','Learning is a gradual process.'],['provide','sağlamak','Trees provide shade and oxygen.'],['purpose','amaç','What is the purpose of this paragraph?'],['reason','neden','Give a reason for your answer.'],['reduce','azaltmak','We should reduce plastic waste.'],
  ['require','gerektirmek','This problem requires careful reading.'],['research','araştırma','The team conducted research on clean energy.'],['respond','yanıt vermek','Respond to the question in two sentences.'],['result','sonuç','The result surprised everyone.'],['separate','ayırmak','Separate the materials into two groups.'],
  ['similar','benzer','The two ideas are similar.'],['solution','çözüm','We found a simple solution.'],['source','kaynak','Check whether the source is reliable.'],['specific','belirli','Use a specific example in your answer.'],['strategy','strateji','A good strategy saves time.'],
  ['structure','yapı','The structure of the story is clear.'],['support','desteklemek','Use facts to support your opinion.'],['theory','kuram','The experiment tested the theory.'],['tradition','gelenek','This tradition continues every year.'],['transform','dönüştürmek','Heat can transform ice into water.'],
  ['valuable','değerli','Feedback is valuable for improvement.'],['variety','çeşitlilik','The garden has a variety of plants.'],['visible','görünür','The moon was clearly visible.'],['volume','hacim','We measured the volume of the box.'],['whether','olup olmadığı','We do not know whether it will rain.']
];


const SUPPLEMENTAL_COMMON_ENGLISH_RAW = [
  ['arm','kol','Raise your arm slowly.'],['back','sırt','Keep your back straight.'],['body','vücut','Water is important for the body.'],['brain','beyin','The brain helps us think.'],['ear','kulak','We hear sounds with our ears.'],
  ['eye','göz','Close one eye and look ahead.'],['face','yüz','Wash your face in the morning.'],['finger','parmak','Point to the map with your finger.'],['foot','ayak','My left foot is wet.'],['hair','saç','Her hair is long and curly.'],
  ['hand','el','Raise your hand to answer.'],['head','baş','Wear a helmet to protect your head.'],['heart','kalp','The heart pumps blood.'],['knee','diz','He hurt his knee while running.'],['leg','bacak','Strong legs help us jump.'],
  ['mouth','ağız','Open your mouth and say ah.'],['nose','burun','We smell flowers with our nose.'],['shoulder','omuz','The bag is on my shoulder.'],['stomach','mide','My stomach is full after lunch.'],['tooth','diş','Brush every tooth carefully.'],
  ['doctor','doktor','The doctor examined the patient.'],['hospital','hastane','The ambulance went to the hospital.'],['medicine','ilaç','Take the medicine with water.'],['patient','hasta','The patient is feeling better.'],['rest','dinlenmek','Sit down and rest for a while.'],
  ['sick','hasta','I stayed home because I was sick.'],['tired','yorgun','She felt tired after the match.'],['well','iyi','I am feeling well today.'],['fever','ateş','A high fever can make you weak.'],['health','sağlık','Sleep is important for our health.'],

  ['bed','yatak','The cat is sleeping on the bed.'],['bedroom','yatak odası','My bedroom has two windows.'],['bathroom','banyo','The bathroom is next to the kitchen.'],['table','masa','Put the plates on the table.'],['sofa','kanepe','We sat together on the sofa.'],
  ['cupboard','dolap','The cups are in the cupboard.'],['carpet','halı','The carpet feels soft.'],['ceiling','tavan','A lamp hangs from the ceiling.'],['wall','duvar','There is a clock on the wall.'],['roof','çatı','Rain fell on the roof.'],
  ['key','anahtar','I found the key under the chair.'],['lamp','lamba','Turn on the lamp to read.'],['mirror','ayna','She looked in the mirror.'],['plate','tabak','The plate is full of fruit.'],['spoon','kaşık','Eat the soup with a spoon.'],
  ['fork','çatal','Use a fork for the salad.'],['knife','bıçak','An adult used the knife carefully.'],['bowl','kâse','The bowl contains rice.'],['bottle','şişe','Fill the bottle with water.'],['towel','havlu','Dry your hands with a towel.'],
  ['soap','sabun','Wash your hands with soap.'],['brush','fırça','Clean the paint brush after use.'],['clock','saat','The clock shows half past nine.'],['radio','radyo','We heard the news on the radio.'],['telephone','telefon','The telephone rang twice.'],
  ['computer','bilgisayar','The computer is on the desk.'],['screen','ekran','Do not sit too close to the screen.'],['bag','çanta','My books are in the bag.'],['box','kutu','The toy is inside the box.'],['drawer','çekmece','The pencils are in the drawer.'],

  ['classroom','sınıf','Our classroom is bright and clean.'],['lesson','ders','The science lesson was interesting.'],['homework','ödev','I finished my homework early.'],['notebook','defter','Write the date in your notebook.'],['eraser','silgi','Use an eraser to fix the mistake.'],
  ['ruler','cetvel','Measure the line with a ruler.'],['desk','sıra','My pencil is under the desk.'],['board','tahta','The teacher wrote on the board.'],['page','sayfa','Turn to page twenty.'],['story','hikâye','The story has a surprising ending.'],
  ['sentence','cümle','This sentence has six words.'],['letter','harf','The word begins with the letter B.'],['number','sayı','Write the number in the box.'],['problem','problem','Read the problem carefully.'],['test','test','The test has ten questions.'],
  ['exam','sınav','She studied hard for the exam.'],['grade','not','He received a high grade.'],['project','proje','Our project is about clean energy.'],['group','grup','Work with your group quietly.'],['team','takım','Our team solved the puzzle.'],
  ['science','fen bilimi','Science helps us understand nature.'],['history','tarih','We learned about an old city in history.'],['geography','coğrafya','Geography teaches us about places.'],['art','sanat','We painted a landscape in art class.'],['subject','ders konusu','Mathematics is my favorite subject.'],
  ['break','teneffüs','We play outside during the break.'],['study','ders çalışmak','I study for thirty minutes every evening.'],['read','okumak','Read the paragraph aloud.'],['count','saymak','Count the stars in the picture.'],['draw','çizmek','Draw a triangle on the paper.'],

  ['ask','sormak','Ask a clear question.'],['bring','getirmek','Bring your notebook tomorrow.'],['buy','satın almak','We buy bread from the bakery.'],['call','aramak','Call me after school.'],['change','değiştirmek','Change the order of the cards.'],
  ['check','kontrol etmek','Check your answer once more.'],['close','kapatmak','Close the window before leaving.'],['cook','yemek pişirmek','We cook vegetables for dinner.'],['cut','kesmek','Cut the paper along the line.'],['dance','dans etmek','They dance to the music.'],
  ['decide','karar vermek','Decide which path is shorter.'],['drink','içmek','Drink water after exercise.'],['drive','araba sürmek','My father can drive carefully.'],['eat','yemek','We eat fruit at breakfast.'],['enter','girmek','Enter the room quietly.'],
  ['fall','düşmek','Leaves fall from the trees.'],['feed','beslemek','We feed the birds in winter.'],['feel','hissetmek','I feel ready for the test.'],['find','bulmak','Find the hidden shape.'],['fly','uçmak','Birds fly over the lake.'],
  ['give','vermek','Give the book to your friend.'],['go','gitmek','We go to school by bus.'],['hear','duymak','I can hear the rain.'],['hold','tutmak','Hold the glass with both hands.'],['jump','zıplamak','The rabbit can jump high.'],
  ['keep','saklamak','Keep your notes in this folder.'],['know','bilmek','I know the answer now.'],['look','bakmak','Look at the diagram carefully.'],['make','yapmak','We make a model from paper.'],['meet','buluşmak','We meet at the library.'],
  ['open','açmak','Open the book to page ten.'],['play','oynamak','Children play in the park.'],['put','koymak','Put the key on the table.'],['run','koşmak','I run around the field.'],['say','söylemek','Say the word slowly.'],
  ['see','görmek','We can see the moon tonight.'],['send','göndermek','Send the message before noon.'],['show','göstermek','Show me how you solved it.'],['sing','şarkı söylemek','They sing a cheerful song.'],['sit','oturmak','Sit near the window.'],
  ['sleep','uyumak','Children need enough time to sleep.'],['speak','konuşmak','Speak clearly and slowly.'],['stand','ayakta durmak','Stand behind the line.'],['swim','yüzmek','We swim in the pool.'],['take','almak','Take one card from the pile.'],
  ['talk','konuşmak','Talk about your idea with the group.'],['teach','öğretmek','Games can teach useful skills.'],['tell','anlatmak','Tell me what happened.'],['think','düşünmek','Think before you choose.'],['throw','atmak','Throw the ball gently.'],
  ['try','denemek','Try a different strategy.'],['turn','dönmek','Turn left after the bridge.'],['wait','beklemek','Wait for the green light.'],['walk','yürümek','We walk to the market.'],['wash','yıkamak','Wash the apple before eating.'],
  ['watch','izlemek','We watch a science video.'],['wear','giymek','Wear a coat in cold weather.'],['win','kazanmak','Practice can help the team win.'],['work','çalışmak','We work together on the project.'],['catch','yakalamak','Catch the ball with both hands.'],

  ['big','büyük','The elephant is a big animal.'],['small','küçük','A mouse is a small animal.'],['long','uzun','The bridge is very long.'],['short','kısa','Write a short answer.'],['old','eski','This old building is a museum.'],
  ['new','yeni','I have a new notebook.'],['good','iyi','That is a good idea.'],['bad','kötü','Too little sleep is bad for health.'],['hot','sıcak','The soup is still hot.'],['cold','soğuk','The water feels cold.'],
  ['fast','hızlı','The train is very fast.'],['slow','yavaş','The turtle is slow.'],['kind','nazik','She is kind to everyone.'],['funny','komik','The story was funny.'],['sad','üzgün','He felt sad after losing the game.'],
  ['clever','zeki','The clever fox found a way out.'],['brave','cesur','The brave child asked for help.'],['busy','meşgul','The street is busy at noon.'],['free','boş','I am free after dinner.'],['full','dolu','The bus is full.'],
  ['heavy','ağır','This box is too heavy.'],['hard','sert, zor','The rock is hard, but the puzzle is also hard.'],['soft','yumuşak','The pillow is soft.'],['high','yüksek','The bird flew high.'],['low','alçak','The shelf is too low.'],
  ['near','yakın','The school is near our house.'],['fresh','taze','We bought fresh bread.'],['dry','kuru','The towel is dry.'],['wet','ıslak','My shoes are wet.'],['safe','güvenli','This path is safe.'],
  ['rich','zengin','The soil is rich in minerals.'],['poor','fakir, zayıf','The plant grew poorly in poor soil.'],['early','erken','We arrived early.'],['late','geç','The bus was late.'],['same','aynı','The two answers are the same.'],
  ['special','özel','Today is a special day.'],['normal','normal','The temperature is normal.'],['impossible','imkânsız','It is impossible to finish without the missing piece.'],['wrong','yanlış','This answer is wrong.'],['correct','doğru','Choose the correct option.'],
  ['closed','kapalı','The shop is closed.'],['noisy','gürültülü','The classroom became noisy.'],['sweet','tatlı','Honey tastes sweet.'],['sour','ekşi','The lemon tastes sour.'],['salty','tuzlu','The soup is too salty.'],
  ['bitter','acı','Some medicine tastes bitter.'],['round','yuvarlak','The coin is round.'],['straight','düz','Draw a straight line.'],['wide','geniş','The river is wide.'],['narrow','dar','This path is narrow.'],

  ['bird','kuş','A bird built a nest.'],['cat','kedi','The cat is under the chair.'],['dog','köpek','The dog wagged its tail.'],['fish','balık','The fish swims in the water.'],['horse','at','The horse runs across the field.'],
  ['cow','inek','The cow eats grass.'],['sheep','koyun','The sheep has thick wool.'],['goat','keçi','The goat climbed the hill.'],['rabbit','tavşan','The rabbit has long ears.'],['turtle','kaplumbağa','The turtle moves slowly.'],
  ['lion','aslan','The lion has a loud roar.'],['tiger','kaplan','A tiger has dark stripes.'],['bear','ayı','The bear lives near the forest.'],['elephant','fil','The elephant has a long trunk.'],['monkey','maymun','The monkey climbed the tree.'],
  ['fox','tilki','The fox ran into the forest.'],['wolf','kurt','The wolf lives in a pack.'],['bee','arı','A bee visits the flower.'],['butterfly','kelebek','The butterfly has colorful wings.'],['ant','karınca','The ant carried a crumb.'],
  ['tree','ağaç','The tree gives us shade.'],['grass','çimen','The grass is green after rain.'],['leaf','yaprak','A leaf fell to the ground.'],['seed','tohum','The seed grew into a plant.'],['stone','taş','The stone is smooth.'],
  ['sand','kum','Children built a castle from sand.'],['sea','deniz','The sea looks calm today.'],['lake','göl','The lake reflects the sky.'],['hill','tepe','We walked up the hill.'],['sky','gökyüzü','The sky is clear.'],
  ['star','yıldız','A bright star appeared at night.'],['sun','güneş','The sun warms the Earth.'],['rain','yağmur','The rain filled the small pond.'],['snow','kar','Snow covered the road.'],['wind','rüzgâr','The wind moved the leaves.'],
  ['storm','fırtına','The storm lasted all night.'],['fire','ateş','The fire gave us heat.'],['ice','buz','The ice melted quickly.'],['wood','odun, ahşap','The table is made of wood.'],['rock','kaya','A large rock blocked the path.']
];

function toWords(raw, minAge, prefix) {
  return raw.map(([word, meaning, example], index) => ({
    id: `${prefix}-${String(index + 1).padStart(3, '0')}-${word}`,
    minAge,
    word,
    meaning,
    example
  }));
}

export const ENGLISH_WORDS = [
  ...toWords(COMMON_ENGLISH_RAW, 8, 'common'),
  ...toWords(MORE_COMMON_ENGLISH_RAW, 8, 'common2'),
  ...toWords(SUPPLEMENTAL_COMMON_ENGLISH_RAW, 8, 'common3'),
  ...toWords(ADVANCED_ENGLISH_RAW, 11, 'advanced')
];

export const EXTRA_WORD_MINE_SETS = [
  { minAge: 8, source: 'paylaşmak', allowed: ['pay', 'paylaş', 'paylaşma', 'yaş', 'yaşamak', 'yaşam', 'aş', 'aşmak', 'mal', 'kal'] },
  { minAge: 8, source: 'öğretmenler', allowed: ['öğretmen', 'öğret', 'öğren', 'öğrenme', 'örme', 'ter', 'ten', 'tel', 'el', 'er', 'men', 'nem'] },
  { minAge: 8, source: 'meraklılık', allowed: ['merak', 'meraklı', 'akıl', 'akıllı', 'kal', 'kır', 'kıl', 'mal', 'kral', 'ılık'] },
  { minAge: 8, source: 'yardımlaşma', allowed: ['yardım', 'yardımlaş', 'ara', 'arama', 'yaş', 'yaşam', 'daş', 'dam', 'dal', 'mal', 'aş', 'aşma'] },
  { minAge: 8, source: 'kitaplıklar', allowed: ['kitap', 'kitaplık', 'kır', 'kalıp', 'kal', 'kat', 'kar', 'kara', 'tarak', 'takı', 'atık'] },
  { minAge: 11, source: 'iletişimsizlik', allowed: ['iletişim', 'iletişimsiz', 'iletim', 'işlem', 'işletim', 'iş', 'sil', 'silik', 'ilim', 'iklim', 'kilim', 'kesim', 'misil', 'limit', 'etki'] },
  { minAge: 11, source: 'değerlendirme', allowed: ['değer', 'değerlen', 'değerlendir', 'değerlendirme', 'derin', 'deneme', 'demir', 'dil', 'din', 'lider', 'emir'] },
  { minAge: 11, source: 'sürdürülebilir', allowed: ['sür', 'süre', 'sürdür', 'sürdürülebilir', 'bir', 'biri', 'bil', 'bilir', 'bile', 'lider', 'seri', 'sel'] },
  { minAge: 11, source: 'araştırmacılar', allowed: ['araştırma', 'araştırmacı', 'araştırmalar', 'araştır', 'ara', 'arama', 'artı', 'aşırı', 'şart', 'martı', 'tarım', 'tarla'] },
  { minAge: 11, source: 'problemçözümü', allowed: ['problem', 'çözüm', 'çöz', 'özlem', 'bölüm', 'bölme', 'ölçüm', 'ölç', 'rol', 'mor', 'zor', 'öz', 'bel', 'bol', 'pom'] }
];

export const EXTRA_TURKISH_WORDS = [
  'araştırma','araştırmalar','araştırmacı','araştırmacılar','araştır','değerlendirme','değerlendir','değerlen','sürdürülebilir',
  'paylaşmak','paylaşma','yaşamak','yaşam','öğretmen','öğret','öğren','öğrenme','meraklılık','akıllı','yardımlaşma','yardımlaş',
  'kitaplık','kitaplıklar','iletişimsizlik','iletişimsiz','işletim','problem','çözümü','çözüm','ölçüm','ölç','bölüm','bölme'
];

export const EXTRA_FORBIDDEN_STORY_PROMPTS = [
  { minAge: 8, letter: 'o', topic: 'Bir piknik gününü üç cümleyle anlat.', minSentences: 3, minUniqueWords: 12 },
  { minAge: 8, letter: 'u', topic: 'Okulda yaşanan komik bir olayı üç cümleyle anlat.', minSentences: 3, minUniqueWords: 12 },
  { minAge: 8, letter: 'm', topic: 'Bir hayvanın macerasını üç cümleyle anlat.', minSentences: 3, minUniqueWords: 13 },
  { minAge: 8, letter: 's', topic: 'Karlı bir günü iki cümleyle anlat.', minSentences: 2, minUniqueWords: 10 },
  { minAge: 11, letter: 'i', topic: 'Bir robotun aldığı önemli kararı dört cümleyle anlat.', minSentences: 4, minUniqueWords: 20 },
  { minAge: 11, letter: 'o', topic: 'Zaman yolculuğunda karşılaşılan bir sorunu dört cümleyle anlat.', minSentences: 4, minUniqueWords: 22 },
  { minAge: 11, letter: 'k', topic: 'Bir bilim insanının başarısız deneyden çıkardığı dersi anlat.', minSentences: 4, minUniqueWords: 22 },
  { minAge: 11, letter: 't', topic: 'Gelecekteki bir şehrin ulaşım sistemini dört cümleyle anlat.', minSentences: 4, minUniqueWords: 22 }
];

export const EXTRA_WORD_LADDERS = [
  { minAge: 8, start: 'CAM', steps: ['CAN'], end: 'KAN', hint: 'Ortadaki kelime yaşam anlamına gelir.' },
  { minAge: 8, start: 'DAR', steps: ['DAL'], end: 'BAL', hint: 'Ortadaki kelime ağacın parçasıdır.' },
  { minAge: 8, start: 'GÜL', steps: ['GÖL'], end: 'GOL', hint: 'Ortadaki kelime su birikintisidir.' },
  { minAge: 8, start: 'KİL', steps: ['DİL'], end: 'DAL', hint: 'Ortadaki kelime konuşmamıza yardım eder.' },
  { minAge: 8, start: 'KUM', steps: ['KUL'], end: 'KOL', hint: 'Ortadaki kelime eski dilde hizmet eden kişi anlamındadır.' },
  { minAge: 8, start: 'SAÇ', steps: ['SAC'], end: 'SAV', hint: 'Ortadaki kelime metal levhadır.' },
  { minAge: 8, start: 'YEL', steps: ['YOL'], end: 'KOL', hint: 'Ortadaki kelime üzerinde yürüdüğümüz yerdir.' },
  { minAge: 8, start: 'TÜL', steps: ['GÜL'], end: 'GÖL', hint: 'İlk adım bir çiçektir.' },
  { minAge: 11, start: 'KARA', steps: ['KARE'], end: 'KERE', hint: 'İlk adım geometrik bir şekildir.' },
  { minAge: 11, start: 'MASA', steps: ['KASA', 'KARA'], end: 'KARE', hint: 'Önce para saklanan yer, sonra bir renk.' },
  { minAge: 11, start: 'DERE', steps: ['DENE', 'DİNE'], end: 'DİNİ', hint: 'İlk adım denemek fiilinin emridir.' },
  { minAge: 11, start: 'KASA', steps: ['KARA', 'KARE'], end: 'KERE', hint: 'Bir renk ve bir geometrik şekil üzerinden ilerle.' }
];

export const EXTRA_MEANING_QUESTIONS = [
  { minAge: 8, prompt: '“Annem sıcak bir gülümsemeyle bizi karşıladı.” cümlesinde “sıcak” hangi anlamdadır?', options: ['Yüksek sıcaklıkta','İçten ve samimi','Acı veren','Parlak'], answer: 1, explanation: 'Sıcak gülümseme, içten ve samimi davranış anlamındadır.' },
  { minAge: 8, prompt: '“Bu haber sınıfta hızla yayıldı.” cümlesinde “yayılmak” ne demektir?', options: ['Yere uzanmak','Birçok kişiye ulaşmak','Genişlemek','Dağılmak'], answer: 1, explanation: 'Haberin yayılması, kısa sürede birçok kişiye ulaşmasıdır.' },
  { minAge: 8, prompt: '“Ali, arkadaşının sözünü kesti.” cümlesinde “sözünü kesmek” ne demektir?', options: ['Kâğıdı kesmek','Konuşmasını yarıda bölmek','Söz vermek','Sessiz konuşmak'], answer: 1, explanation: 'Sözünü kesmek, konuşan kişinin konuşmasını yarıda bölmektir.' },
  { minAge: 8, prompt: '“Sorunun püf noktasını bulunca hemen çözdü.” cümlesinde “püf noktası” nedir?', options: ['Sorunun en zor yazısı','Çözümü kolaylaştıran önemli ayrıntı','Yanlış cevap','Soru işareti'], answer: 1, explanation: 'Püf noktası, bir işi kolaylaştıran temel ve önemli ayrıntıdır.' },
  { minAge: 11, prompt: '“Yeni bulgu, tartışmaya farklı bir pencere açtı.” cümlesinde “pencere açmak” ne demektir?', options: ['Odayı havalandırmak','Yeni bir bakış açısı kazandırmak','Konuyu kapatmak','Kanıtı yok etmek'], answer: 1, explanation: 'Farklı bir pencere açmak, konuya yeni bir bakış açısı getirmektir.' },
  { minAge: 11, prompt: '“Konuşmacı, düşüncelerini sağlam temellere oturttu.” cümlesinde “sağlam temel” neyi anlatır?', options: ['Beton yapı','Güvenilir gerekçe ve kanıt','Yüksek ses','Uzun cümle'], answer: 1, explanation: 'Sağlam temel, düşüncenin güvenilir gerekçe ve kanıtlara dayanmasıdır.' },
  { minAge: 11, prompt: '“Bu küçük ayrıntı bütün planın kilidiydi.” cümlesinde “kilit” hangi anlamdadır?', options: ['Kapı aracı','En belirleyici unsur','Gizli eşya','Metal parça'], answer: 1, explanation: 'Kilit, burada planı çözmeye yarayan en belirleyici unsur anlamındadır.' },
  { minAge: 11, prompt: '“Yazar, okuru olayın tam ortasına çekiyor.” cümlesi ne anlatır?', options: ['Okurun kitabı bırakmasını','Anlatımın okura yaşanıyormuş hissi vermesini','Olayın bitmesini','Yazarın okurla görüşmesini'], answer: 1, explanation: 'İfade, anlatımın okuru olayın içindeymiş gibi hissettirmesini anlatır.' }
];

export const EXTRA_PARAGRAPH_QUESTIONS = [
  { minAge: 8, context: 'Ece, bitkinin bir yaprağını karanlık dolapta, diğer yaprağını güneş alan pencerenin önünde tuttu. Birkaç gün sonra pencere önündeki yaprağın daha canlı kaldığını gördü.', prompt: 'Ece bu gözlemle en çok hangi sonuca ulaşabilir?', options: ['Bitkiler hiç su istemez.','Işık, bitkinin canlı kalmasına yardımcı olur.','Karanlık her bitkiyi büyütür.','Yaprakların hepsi aynı hızda büyür.'], answer: 1, explanation: 'İki yaprak arasındaki temel fark ışık olduğundan sonuç ışığın etkisiyle ilgilidir.' },
  { minAge: 8, context: 'Mert, ödevini yaparken zorlandığı soruları ayrı bir kâğıda yazdı. Ertesi gün öğretmenine yalnız bu soruları sordu. Böylece anlamadığı konuları kısa sürede tamamladı.', prompt: 'Mert’in kullandığı çalışma yöntemi hangisidir?', options: ['Soruları atlamak','Eksiklerini belirleyip yardım istemek','Bütün ödevi yeniden yazmak','Yalnız kolay soruları çözmek'], answer: 1, explanation: 'Mert zorlandığı soruları belirleyip öğretmeninden hedefli yardım almıştır.' },
  { minAge: 8, context: 'Mahalledeki boş alana çocuk parkı yapılacaktı. Çocuklar salıncak isterken yetişkinler yürüyüş yolu da olmasını istedi. Belediye iki isteği de plana ekledi.', prompt: 'Bu olayda hangi çözüm yolu kullanılmıştır?', options: ['Yalnız bir grubun isteği kabul edilmiştir.','İki tarafın ihtiyacı birlikte karşılanmıştır.','Park yapmaktan vazgeçilmiştir.','Karar rastgele verilmiştir.'], answer: 1, explanation: 'Plan hem çocukların hem yetişkinlerin isteğini karşılayacak biçimde düzenlenmiştir.' },
  { minAge: 11, context: 'Bir bilginin çok paylaşılması, onun doğru olduğunu kanıtlamaz. Bilginin kaynağı, yayın tarihi ve başka güvenilir kaynaklarla uyuşup uyuşmadığı incelenmelidir. Özellikle şaşırtıcı iddialar, paylaşılmadan önce iki kez kontrol edilmelidir.', prompt: 'Parçanın ana düşüncesi hangisidir?', options: ['Çok paylaşılan her bilgi doğrudur.','Şaşırtıcı bilgiler hemen paylaşılmalıdır.','Bilgiler paylaşılmadan önce kaynak ve doğruluk açısından denetlenmelidir.','Yayın tarihi bilgide önemli değildir.'], answer: 2, explanation: 'Parça, bilgiyi paylaşmadan önce kaynağını ve doğruluğunu kontrol etmeyi vurgular.' },
  { minAge: 11, context: 'Bir takımın başarılı olması için herkesin aynı şeyi düşünmesi gerekmez. Farklı görüşler, doğru biçimde tartışıldığında eksik noktaları görünür kılar. Ancak tartışma kişilere değil fikirlere yönelmelidir.', prompt: 'Bu parçadan hangisi çıkarılabilir?', options: ['Farklı görüşler her zaman çatışma yaratır.','Takım üyeleri eleştiri yapmamalıdır.','Yapıcı fikir ayrılıkları takımın kararını güçlendirebilir.','Başarı için herkes aynı fikri savunmalıdır.'], answer: 2, explanation: 'Metin, kişiselleşmeyen fikir ayrılıklarının eksikleri ortaya çıkarabileceğini söyler.' },
  { minAge: 11, context: 'Bir problemi çözmeye başlamadan önce sonucu yaklaşık olarak tahmin etmek yararlıdır. İşlem sonunda bulunan değer tahminden çok uzaksa, işlem sırası veya kullanılan veriler yeniden kontrol edilir.', prompt: 'Tahmin yapmanın metinde belirtilen yararı nedir?', options: ['Kesin cevabı işlem yapmadan bulmak','İşlem hatalarını fark etmeye yardımcı olmak','Soruyu kısaltmak','Bütün verileri gereksiz kılmak'], answer: 1, explanation: 'Tahmin, bulunan sonucun makul olup olmadığını kontrol etmeyi sağlar.' }
];

export const LOGIC_QUESTIONS_V2 = [
  { minAge: 8, context: 'Ece, Can ve Mert yarışta farklı sıralarda bitirdi. Ece, Mert’ten önce; Can ise Ece’den sonra bitirdi.', prompt: 'Aşağıdakilerden hangisi kesinlikle doğrudur?', options: ['Mert birincidir.','Ece, Can’dan önce bitirmiştir.','Can, Mert’ten önce bitirmiştir.','Mert sonuncudur.'], answer: 1, explanation: 'Can Ece’den sonra olduğuna göre Ece kesinlikle Can’dan önce bitirmiştir.' },
  { minAge: 8, context: 'Kırmızı kutu mavi kutunun solunda, sarı kutu kırmızı kutunun sağındadır. Mavi kutu en sağda değildir.', prompt: 'Hangi sıralama mümkündür?', options: ['Mavi - Kırmızı - Sarı','Kırmızı - Sarı - Mavi','Sarı - Kırmızı - Mavi','Kırmızı - Mavi - Sarı'], answer: 3, explanation: 'Kırmızı mavinin solunda olmalı; sarı da kırmızının sağında olmalıdır. Kırmızı-Mavi-Sarı uygundur.' },
  { minAge: 8, context: 'Bir kodda harfler 2-1-4-3 sırasıyla yazılıyor. Örneğin KEDİ → EKİD.', prompt: 'Aynı kuralla MASA nasıl yazılır?', options: ['AMAS','ASAM','SAMA','AASM'], answer: 0, explanation: '2., 1., 4. ve 3. harfler alınır: A-M-A-S = AMAS.' },
  { minAge: 8, context: 'Ayşe pazartesi veya salı, Bora salı veya çarşamba, Ceren yalnız perşembe günü gelebilir. Her gün yalnız bir kişi gelir.', prompt: 'Ayşe salı günü gelirse Bora hangi gün gelmelidir?', options: ['Pazartesi','Salı','Çarşamba','Perşembe'], answer: 2, explanation: 'Salı Ayşe’ye ayrıldığından Bora’nın tek seçeneği çarşambadır.' },
  { minAge: 8, context: 'Dört kartın üzerinde 2, 4, 6 ve 8 yazıyor. Ela’nın kartı 4’ten büyük, 8’den küçüktür.', prompt: 'Ela’nın kartında hangi sayı vardır?', options: ['2','4','6','8'], answer: 2, explanation: '4’ten büyük ve 8’den küçük tek seçenek 6’dır.' },
  { minAge: 11, context: 'Matematik, Türkçe, Fen ve Tarih kitapları soldan sağa dizilecektir. Matematik, Türkçenin solundadır. Fen, Tarihin hemen solundadır. Türkçe en sağda değildir.', prompt: 'Aşağıdaki sıralamalardan hangisi mümkündür?', options: ['Matematik - Türkçe - Fen - Tarih','Fen - Tarih - Matematik - Türkçe','Matematik - Fen - Tarih - Türkçe','Fen - Matematik - Tarih - Türkçe'], answer: 0, explanation: 'A seçeneğinde Matematik Türkçenin solunda, Fen Tarihin hemen solunda ve Türkçe en sağda değildir.' },
  { minAge: 11, context: 'Dört öğrenci farklı günlerde sunum yapacaktır. Deniz, Ece’den önce; Ece, Burak’tan önce sunum yapacaktır. Aslı pazartesi günü sunum yapmaz.', prompt: 'Aşağıdakilerden hangisi kesinlikle doğrudur?', options: ['Deniz, Burak’tan önce sunum yapar.','Aslı son gün sunum yapar.','Ece ilk gün sunum yapar.','Burak, Aslı’dan önce sunum yapar.'], answer: 0, explanation: 'Deniz < Ece < Burak ilişkisi nedeniyle Deniz kesinlikle Burak’tan önce sunum yapar.' },
  { minAge: 11, context: 'Bir adada doğrucular her zaman doğru, yalancılar her zaman yanlış söyler. A kişisi “B yalancıdır.”, B kişisi “İkimiz de aynı türdeyiz.” diyor.', prompt: 'A ve B’nin türleri nedir?', options: ['İkisi de doğrucu','A doğrucu, B yalancı','A yalancı, B doğrucu','İkisi de yalancı'], answer: 1, explanation: 'A doğruysa B yalancıdır; B’nin “aynı türdeyiz” sözü de yanlış olur. Bu durum tutarlıdır.' },
  { minAge: 11, context: 'Bir şifrelemede her harf alfabede kendinden bir sonraki harfle değiştirilir. Z harfi A olur.', prompt: 'KALEM sözcüğünün ilk iki harfi nasıl değişir?', options: ['KL','LB','KB','LÇ'], answer: 1, explanation: 'K’den sonra L, A’dan sonra B gelir; ilk iki harf LB olur.' },
  { minAge: 11, context: 'Bir toplantıda P, R’den önce; R, S’den önce konuşacaktır. T ise P’den sonra ama S’den önce konuşacaktır.', prompt: 'Aşağıdaki sıralamalardan hangisi mümkündür?', options: ['R-P-T-S','P-T-R-S','P-S-R-T','T-P-R-S'], answer: 1, explanation: 'P-T-R-S sıralaması bütün önce-sonra koşullarını sağlar.' },
  { minAge: 11, context: 'Beş kutudan yalnız biri ödüllüdür. 1. kutu “Ödül 2’de”, 2. kutu “Ödül 5’te değil”, 3. kutu “Ödül bende”, 4. kutu “Ödül 1’de değil”, 5. kutu “Ödül 3’te” diyor. Yalnız bir ifade doğrudur.', prompt: 'Ödül hangi kutudadır?', options: ['1','2','3','5'], answer: 0, explanation: 'Ödül 1’deyse yalnız 2. kutunun “5’te değil” sözü doğrudur; diğer ifadeler yanlıştır.' },
  { minAge: 11, context: 'A, B, C ve D yan yana oturacaktır. A uçta değildir. B, C’nin hemen solundadır. D, A’nın solundadır.', prompt: 'Hangi sıralama mümkündür?', options: ['A-B-C-D','D-A-B-C','B-C-D-A','C-B-A-D'], answer: 1, explanation: 'D-A-B-C sıralamasında A uçta değildir, B-C yan yanadır ve D A’nın solundadır.' }
];

export const SCIENCE_QUESTIONS = [
  { minAge: 8, prompt: 'Buz erirken hangi hâl değişimi gerçekleşir?', options: ['Katıdan sıvıya','Sıvıdan gaza','Gazdan sıvıya','Sıvıdan katıya'], answer: 0, explanation: 'Erime, maddenin katı hâlden sıvı hâle geçmesidir.' },
  { minAge: 8, prompt: 'Bitkilerin kendi besinlerini üretmesine en çok hangi yapı yardım eder?', options: ['Kök','Yaprak','Çiçek','Tohum'], answer: 1, explanation: 'Fotosentezin büyük bölümü yapraklarda gerçekleşir.' },
  { minAge: 8, prompt: 'Aşağıdakilerden hangisi ışık kaynağıdır?', options: ['Ay','Ayna','Güneş','Beyaz kâğıt'], answer: 2, explanation: 'Güneş kendi ışığını üretir; Ay ve diğerleri ışığı yansıtır.' },
  { minAge: 8, prompt: 'Bir mıknatıs en güçlü çekimi genellikle nerede gösterir?', options: ['Tam ortasında','Kutuplarında','Her yerinde eşit','Yalnız üst yüzünde'], answer: 1, explanation: 'Mıknatısın çekim gücü kutup bölgelerinde daha fazladır.' },
  { minAge: 8, prompt: 'Dünya’nın kendi ekseni etrafında dönmesi neyi oluşturur?', options: ['Mevsimleri','Gece ve gündüzü','Ay tutulmasını','Yılları'], answer: 1, explanation: 'Dünya’nın günlük dönüşü gece ve gündüzü oluşturur.' },
  { minAge: 8, prompt: 'Ses hangi ortamda yayılamaz?', options: ['Hava','Su','Katı','Boşluk'], answer: 3, explanation: 'Sesin yayılması için madde tanecikleri gerekir; boşlukta ses yayılmaz.' },
  { minAge: 8, prompt: 'Aşağıdakilerden hangisi elektrik iletkenidir?', options: ['Plastik kaşık','Bakır tel','Tahta çubuk','Cam bardak'], answer: 1, explanation: 'Bakır, elektrik akımını iyi ileten bir metaldir.' },
  { minAge: 8, prompt: 'Kalp vücudumuzda hangi görevi yapar?', options: ['Besinleri sindirir','Kanı pompalar','Havayı temizler','Kemikleri büyütür'], answer: 1, explanation: 'Kalp, kanı damarlar aracılığıyla vücuda pompalar.' },
  { minAge: 8, prompt: 'Gölgenin oluşması için aşağıdakilerden hangisi gereklidir?', options: ['Işık kaynağı ve opak cisim','Yalnız su','Yalnız ses','Şeffaf cisim ve karanlık'], answer: 0, explanation: 'Opak cisim ışığın geçmesini engeller ve arkasında gölge oluşur.' },
  { minAge: 8, prompt: 'Bir cismi itmek veya çekmek hangi kavramla adlandırılır?', options: ['Enerji','Kuvvet','Hız','Sıcaklık'], answer: 1, explanation: 'İtme ve çekme etkilerinin genel adı kuvvettir.' },
  { minAge: 11, prompt: 'Bir deneyde yalnız ışık miktarının etkisi araştırılıyorsa diğer koşullar nasıl olmalıdır?', options: ['Hepsi değiştirilmelidir','Mümkün olduğunca sabit tutulmalıdır','Ölçülmemelidir','Rastgele seçilmelidir'], answer: 1, explanation: 'Tek değişkenin etkisini görebilmek için diğer koşullar kontrol edilmelidir.' },
  { minAge: 11, prompt: 'Bir atomun çekirdeğinde hangi parçacıklar bulunur?', options: ['Proton ve nötron','Elektron ve proton','Yalnız elektron','Molekül ve iyon'], answer: 0, explanation: 'Atom çekirdeğinde protonlar ve nötronlar bulunur; elektronlar çekirdek çevresindedir.' },
  { minAge: 11, prompt: 'Seri bağlı bir devrede ampullerden biri çıkarılırsa ne olur?', options: ['Diğerleri daha parlak yanar','Devre açılır ve diğerleri de söner','Hiçbir şey değişmez','Pil kendiliğinden dolar'], answer: 1, explanation: 'Seri devrede akımın tek yolu vardır; bir ampul çıkarılınca yol kesilir.' },
  { minAge: 11, prompt: 'Saf suyun normal atmosfer basıncında kaynama sıcaklığı yaklaşık kaç °C’dir?', options: ['0','50','100','212'], answer: 2, explanation: 'Saf su deniz seviyesinde yaklaşık 100 °C’de kaynar.' },
  { minAge: 11, prompt: 'Fotosentez sırasında bitkiler havadan ağırlıklı olarak hangi gazı alır?', options: ['Oksijen','Karbondioksit','Azot','Hidrojen'], answer: 1, explanation: 'Bitkiler fotosentezde karbondioksit ve suyu kullanarak besin üretir.' },
  { minAge: 11, prompt: 'Aşağıdakilerden hangisi kimyasal değişime örnektir?', options: ['Buzun erimesi','Kâğıdın yırtılması','Demirin paslanması','Suyun donması'], answer: 2, explanation: 'Paslanmada yeni maddeler oluştuğu için kimyasal değişim gerçekleşir.' },
  { minAge: 11, prompt: 'Bir cismin sürati nasıl hesaplanır?', options: ['Yol × zaman','Yol ÷ zaman','Zaman ÷ yol','Kütle ÷ hacim'], answer: 1, explanation: 'Sürat, alınan yolun geçen zamana bölünmesiyle bulunur.' },
  { minAge: 11, prompt: 'Kalıtsal bilgiyi taşıyan temel yapı hangisidir?', options: ['Hücre zarı','DNA','Sitoplazma','Doku'], answer: 1, explanation: 'DNA, kalıtsal bilgiyi taşıyan moleküldür.' },
  { minAge: 11, prompt: 'Asit ve bazların tepkimesi sonucunda genellikle ne oluşur?', options: ['Yalnız gaz','Tuz ve su','Yalnız metal','Işık ve ses'], answer: 1, explanation: 'Nötralleşme tepkimesinde genellikle tuz ve su oluşur.' },
  { minAge: 11, prompt: 'Basınç aynı kuvvet için yüzey alanı küçüldüğünde nasıl değişir?', options: ['Azalır','Artar','Değişmez','Sıfır olur'], answer: 1, explanation: 'Basınç kuvvetin yüzey alanına bölümüdür; alan küçülünce basınç artar.' }
];

export const SCIENCE_REASONING_QUESTIONS = [
  { minAge: 8, context: 'Aynı büyüklükte iki buz parçasından biri metal tabağa, diğeri tahta tabağa konuyor. Metal tabaktaki buz daha hızlı eriyor.', prompt: 'Bu gözlem en iyi hangi çıkarımı destekler?', options: ['Metal ısıyı tahtadan daha iyi iletir.','Tahta her zaman daha sıcaktır.','Buz metalden yapılmıştır.','Tabağın rengi erimeyi belirler.'], answer: 0, explanation: 'Metal, çevreden aldığı ısıyı buza tahtadan daha hızlı iletir.' },
  { minAge: 8, context: 'Bir öğrenci üç özdeş bitkiye eşit miktarda su veriyor. Bitkileri karanlık, loş ve güneşli yerlere koyuyor.', prompt: 'Bu deneyde değiştirilen koşul hangisidir?', options: ['Su miktarı','Bitki türü','Işık miktarı','Saksı büyüklüğü'], answer: 2, explanation: 'Bitkiler ve su aynı, yalnız ışık miktarı farklıdır.' },
  { minAge: 8, context: 'Bir oyuncak araba pürüzsüz zeminde 4 metre, halıda 2 metre ilerliyor.', prompt: 'Sonuç hangi düşünceyi destekler?', options: ['Halı sürtünmeyi artırır.','Pürüzsüz zemin arabayı ağırlaştırır.','Arabanın rengi hızını belirler.','Halı kuvveti yok eder.'], answer: 0, explanation: 'Halıdaki daha büyük sürtünme arabanın daha kısa yol almasına neden olur.' },
  { minAge: 11, context: 'Bir deneyde sıcaklık 20 °C’den 30 °C’ye çıkarıldığında tepkime süresi 80 saniyeden 45 saniyeye düşüyor. Diğer koşullar aynı tutuluyor.', prompt: 'Hangi sonuç çıkarılabilir?', options: ['Sıcaklık artınca tepkime yavaşlamıştır.','Sıcaklık artışı bu tepkimeyi hızlandırmıştır.','Süre ile sıcaklık ilgisizdir.','Tepkime hiç gerçekleşmemiştir.'], answer: 1, explanation: 'Aynı olayın daha kısa sürede tamamlanması tepkimenin hızlandığını gösterir.' },
  { minAge: 11, context: 'Bir öğrenci gübrenin bitki boyuna etkisini araştırıyor. Bir gruba gübre veriyor, diğer gruba vermiyor. Ancak gübre verilen bitkileri ayrıca daha fazla suluyor.', prompt: 'Deneyin temel sorunu nedir?', options: ['Bitki sayısı çoktur.','Aynı anda iki değişken değiştirilmiştir.','Boy ölçülmüştür.','Kontrol grubu vardır.'], answer: 1, explanation: 'Hem gübre hem su miktarı değiştiği için sonucun hangi etkenden kaynaklandığı anlaşılamaz.' },
  { minAge: 11, context: 'Bir ölçüm cihazı aynı cismi art arda 50,1 g; 50,0 g; 50,1 g ölçüyor. Gerçek değer 53,0 g.', prompt: 'Bu ölçümler için hangisi doğrudur?', options: ['Hassas ama doğru değildir.','Doğru ama hassas değildir.','Hem doğru hem hassastır.','Ne doğru ne hassastır.'], answer: 0, explanation: 'Ölçümler birbirine çok yakın olduğu için hassas, gerçek değerden uzak olduğu için doğru değildir.' }
];
