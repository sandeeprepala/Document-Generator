import { pipeline } from '@xenova/transformers';

function cosineSimilarity(vecA, vecB) {

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function testEmbedding() {

    const extractor = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2'
    );

    // Similar authentication-related code
    const code1 = `
        function loginUser(email,password){
            return jwt.sign({email},SECRET_KEY)
        }
    `;

    const code2 = `
        app.post('/login',(req,res)=>{
            const token = jwt.sign(user,SECRET_KEY)
        })
    `;

    // Completely different code
    const code3 = `
        function calculateTotal(items){
            return items.reduce((a,b)=>a+b.price,0)
        }
    `;

    const emb1 = await extractor(code1,{
        pooling:'mean',
        normalize:true
    });

    const emb2 = await extractor(code2,{
        pooling:'mean',
        normalize:true
    });

    const emb3 = await extractor(code3,{
        pooling:'mean',
        normalize:true
    });

    const vec1 = Array.from(emb1.data);
    const vec2 = Array.from(emb2.data);
    const vec3 = Array.from(emb3.data);

    console.log("\nSimilarity between auth codes:");
    console.log(cosineSimilarity(vec1,vec2));

    console.log("\nSimilarity between auth and cart code:");
    console.log(cosineSimilarity(vec1,vec3));
}

testEmbedding();