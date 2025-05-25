export function getSafeTwitchThumbnail(username: string): string {
  const login = username.toLowerCase();
  const raw = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${login}-640x360.jpg`;

  // Benutzerspezifische Fallbacks
  //const userFallbacks: Record<string, string> = {
  //  'hiro_live': 'https://cdn.meat-bot.de/fallbacks/hiro_special.webp',
  //  'brinibrinsen': 'https://cdn.meat-bot.de/fallbacks/brini_purpledream.webp'
  //};

  // Random-Fallbacks für alle anderen
  const fallbackImages = [
    'https://media.discordapp.net/attachments/1374459199181951087/1375184199019139213/ChatGPT_Image_22._Mai_2025_20_46_08.png?ex=6830c396&is=682f7216&hm=e2b5954f86a47a6b693c30de00151f693825737762bfb5a823c0f2c47d314e4e&=&format=webp&quality=lossless&width=942&height=628',
    'https://media.discordapp.net/attachments/1374459199181951087/1375189525269184532/ChatGPT_Image_22._Mai_2025_20_58_14.png?ex=6830c88c&is=682f770c&hm=10ac7b4b289d0309e7f392b2b84b67751ae63741f07a90949ad3a58ce9c61050&=&format=webp&quality=lossless&width=942&height=628',
    'https://media.discordapp.net/attachments/1374459199181951087/1375189631343001791/ChatGPT_Image_22._Mai_2025_21_07_04.png?ex=6830c8a5&is=682f7725&hm=d6c64d4b7978eaf0879b642b1f465fcb9ce053eb39065f9cb42093f7f99f170e&=&format=webp&quality=lossless&width=942&height=628',
    'https://media.discordapp.net/attachments/1374459199181951087/1375189672292122726/ChatGPT_Image_22._Mai_2025_21_09_22.png?ex=6830c8af&is=682f772f&hm=de8d1a31f90cbb69de421ed444eeb1d88ea5abcb858becac5c6aa98fca4bc4b9&=&format=webp&quality=lossless&width=942&height=628',
    'https://media.discordapp.net/attachments/1374459199181951087/1375191647406526464/ChatGPT_Image_22._Mai_2025_21_20_11.png?ex=6830ca86&is=682f7906&hm=517e9700e78092b076da30aa03717787faa4f30bd0431320bd23bc26d4d7a38b&=&format=webp&quality=lossless&width=942&height=628',
    'https://media.discordapp.net/attachments/1374459199181951087/1375193799244120175/ChatGPT_Image_22._Mai_2025_20_52_27.png?ex=6830cc87&is=682f7b07&hm=50c9647a4f7ed4475ed9cd494e392b68afba46d704223d53b012173388247581&=&format=webp&quality=lossless&width=942&height=628',
    'https://media.discordapp.net/attachments/1374459199181951087/1375194092366991400/ChatGPT_Image_22._Mai_2025_21_30_11.png?ex=6830cccd&is=682f7b4d&hm=ae6ad6d4c1cd26ce01fe67fc26c49696010e0dda0d3fae33b711f2ae54f0a7a3&=&format=webp&quality=lossless&width=942&height=628',
    'https://media.discordapp.net/attachments/1374459199181951087/1375198563683799100/ChatGPT_Image_22._Mai_2025_21_47_58.png?ex=6830d0f7&is=682f7f77&hm=e6c921e1c52cd27459802b4bf4d65ad64df382a75b789bc9bb5286f5c83f942d&=&format=webp&quality=lossless&width=942&height=628',
    'https://media.discordapp.net/attachments/1374459199181951087/1375200696021811220/ChatGPT_Image_22._Mai_2025_21_56_17.png?ex=6830d2f3&is=682f8173&hm=d7041be0c28377872ed6206755ec233bd4b00a8a87eed087af0f1334a90499be&=&format=webp&quality=lossless&width=942&height=628',
    'https://media.discordapp.net/attachments/1374459199181951087/1375204655289864263/ChatGPT_Image_22._Mai_2025_22_11_38.png?ex=6830d6a3&is=682f8523&hm=30d560d46b03b932cfb7bbe38a5cc7bc706ea599f0e43afcde750804af5d5adc&=&format=webp&quality=lossless&width=942&height=628',
    'https://media.discordapp.net/attachments/1374459199181951087/1375206874042859611/ChatGPT_Image_22._Mai_2025_22_21_01.png?ex=6830d8b4&is=682f8734&hm=3d54c0cc4a05925e9c2decfbd347c3787f8f664715fbebfe512a181dcf3995d4&=&format=webp&quality=lossless&width=942&height=628'
  ];

  const fallback = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];

  return raw.includes('404_preview') ? fallback : raw;
}
