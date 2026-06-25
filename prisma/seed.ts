import { db } from "../src/lib/db";

const words = [
  { rank: 1, word: "the", translation: "o, a, os, as", phonetic: "/ðə/", sentenceEn: "The book is on the table.", sentencePt: "O livro está sobre a mesa." },
  { rank: 2, word: "of", translation: "de", phonetic: "/əv/", sentenceEn: "A cup of coffee.", sentencePt: "Uma xícara de café." },
  { rank: 3, word: "to", translation: "para, a", phonetic: "/tuː/", sentenceEn: "I want to go home.", sentencePt: "Eu quero ir para casa." },
  { rank: 4, word: "and", translation: "e", phonetic: "/ænd/", sentenceEn: "Black and white.", sentencePt: "Preto e branco." },
  { rank: 5, word: "a", translation: "um, uma", phonetic: "/ə/", sentenceEn: "He is a doctor.", sentencePt: "Ele é um médico." },
  { rank: 6, word: "in", translation: "em, dentro", phonetic: "/ɪn/", sentenceEn: "She is in the car.", sentencePt: "Ela está no carro." },
  { rank: 7, word: "is", translation: "é, está", phonetic: "/ɪz/", sentenceEn: "Life is beautiful.", sentencePt: "A vida é bela." },
  { rank: 8, word: "you", translation: "você, vocês", phonetic: "/juː/", sentenceEn: "I love you.", sentencePt: "Eu amo você." },
  { rank: 9, word: "that", translation: "que, aquele, aquela", phonetic: "/ðæt/", sentenceEn: "Look at that house.", sentencePt: "Olhe para aquela casa." },
  { rank: 10, word: "it", translation: "ele, ela (neutro), isto", phonetic: "/ɪt/", sentenceEn: "It is raining.", sentencePt: "Está chovendo." },
  { rank: 11, word: "he", translation: "ele", phonetic: "/hiː/", sentenceEn: "He is my friend.", sentencePt: "Ele é meu amigo." },
  { rank: 12, word: "was", translation: "era, estava", phonetic: "/wɒz/", sentenceEn: "He was tired.", sentencePt: "Ele estava cansado." },
  { rank: 13, word: "for", translation: "para, por", phonetic: "/fɔː/", sentenceEn: "This gift is for you.", sentencePt: "Este presente é para você." },
  { rank: 14, word: "on", translation: "em, sobre", phonetic: "/ɒn/", sentenceEn: "The keys are on the desk.", sentencePt: "As chaves estão sobre a escrivaninha." },
  { rank: 15, word: "are", translation: "são, estão", phonetic: "/ɑː/", sentenceEn: "We are happy.", sentencePt: "Nós estamos felizes." },
  { rank: 16, word: "as", translation: "como", phonetic: "/æz/", sentenceEn: "Do as I say.", sentencePt: "Faça como eu digo." },
  { rank: 17, word: "with", translation: "com", phonetic: "/wɪð/", sentenceEn: "Come with me.", sentencePt: "Venha comigo." },
  { rank: 18, word: "his", translation: "dele", phonetic: "/hɪz/", sentenceEn: "This is his car.", sentencePt: "Este é o carro dele." },
  { rank: 19, word: "they", translation: "eles, elas", phonetic: "/ðeɪ/", sentenceEn: "They are learning English.", sentencePt: "Eles estão aprendendo inglês." },
  { rank: 20, word: "i", translation: "eu", phonetic: "/aɪ/", sentenceEn: "I want to play a game.", sentencePt: "Eu quero jogar um jogo." },
  { rank: 21, word: "at", translation: "em, no, na", phonetic: "/æt/", sentenceEn: "I am at school.", sentencePt: "Eu estou na escola." },
  { rank: 22, word: "be", translation: "ser, estar", phonetic: "/biː/", sentenceEn: "Be yourself.", sentencePt: "Seja você mesmo." },
  { rank: 23, word: "this", translation: "este, esta, isto", phonetic: "/ðɪs/", sentenceEn: "This is my house.", sentencePt: "Esta é a minha casa." },
  { rank: 24, word: "have", translation: "ter, possuir", phonetic: "/hæv/", sentenceEn: "I have a dog.", sentencePt: "Eu tenho um cachorro." },
  { rank: 25, word: "from", translation: "de, a partir de", phonetic: "/frɒm/", sentenceEn: "I am from Brazil.", sentencePt: "Eu sou do Brasil." },
  { rank: 26, word: "or", translation: "ou", phonetic: "/ɔː/", sentenceEn: "Yes or no?", sentencePt: "Sim ou não?" },
  { rank: 27, word: "one", translation: "um, uma (número)", phonetic: "/wʌn/", sentenceEn: "Only one question.", sentencePt: "Apenas uma pergunta." },
  { rank: 28, word: "had", translation: "tinha, tinha estado", phonetic: "/hæd/", sentenceEn: "She had a dream.", sentencePt: "Ela teve um sonho." },
  { rank: 29, word: "by", translation: "por, ao lado de", phonetic: "/baɪ/", sentenceEn: "Written by me.", sentencePt: "Escrito por mim." },
  { rank: 30, word: "word", translation: "palavra", phonetic: "/wɜːd/", sentenceEn: "What is this word?", sentencePt: "Qual é essa palavra?" },
  { rank: 31, word: "but", translation: "mas, porém", phonetic: "/bʌt/", sentenceEn: "I want to, but I can't.", sentencePt: "Eu quero, mas não posso." },
  { rank: 32, word: "not", translation: "não", phonetic: "/nɒt/", sentenceEn: "It is not cold today.", sentencePt: "Não está frio hoje." },
  { rank: 33, word: "what", translation: "o que, qual", phonetic: "/wɒt/", sentenceEn: "What are you doing?", sentencePt: "O que você está fazendo?" },
  { rank: 34, word: "all", translation: "tudo, todos", phonetic: "/ɔːl/", sentenceEn: "All we need is love.", sentencePt: "Tudo o que precisamos é amor." },
  { rank: 35, word: "were", translation: "eram, estavam", phonetic: "/wɜː/", sentenceEn: "They were playing.", sentencePt: "Eles estavam jogando." },
  { rank: 36, word: "we", translation: "nós", phonetic: "/wiː/", sentenceEn: "We can do it.", sentencePt: "Nós podemos fazer isso." },
  { rank: 37, word: "when", translation: "quando", phonetic: "/wen/", sentenceEn: "When are you leaving?", sentencePt: "Quando você vai embora?" },
  { rank: 38, word: "your", translation: "seu, sua", phonetic: "/jɔː/", sentenceEn: "What is your name.", sentencePt: "Qual é o seu nome?" },
  { rank: 39, word: "can", translation: "poder, conseguir", phonetic: "/kæn/", sentenceEn: "You can do this.", sentencePt: "Você consegue fazer isso." },
  { rank: 40, word: "said", translation: "disse", phonetic: "/sed/", sentenceEn: "She said hello.", sentencePt: "Ela disse olá." },
];

async function main() {
  console.log("Seeding database...");
  for (const w of words) {
    await db.word.upsert({
      where: { rank: w.rank },
      update: {},
      create: w,
    });
  }
  console.log("Database seeded successfully with 40 words!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
