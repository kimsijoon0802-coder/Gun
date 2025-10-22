import { GoogleGenAI } from "@google/genai";
import { Item } from '../types';

const fallbackLore = "이 아이템에 대한 데이터가 손상되었습니다. 하지만 전장에서 그 가치를 증명할 것은 분명합니다.";

export const generateItemLore = async (item: Item): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `배틀 로얄 게임의 "${item.name}" (${item.type}) 아이템에 대한 흥미로운 배경 이야기를 2~3문장으로 생성해줘. 이 아이템의 설명은 다음과 같아: "${item.description}"`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || fallbackLore;
  } catch (error) {
    console.error("Gemini API 호출 중 오류 발생:", error);
    return fallbackLore;
  }
};
