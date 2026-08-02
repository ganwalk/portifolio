import type { Dictionary } from "./pt";

export const zh: Dictionary = {
  meta: {
    title: "Armando Custodio, Design Engineer",
    description: "从银行到音乐的互动体验，始终以数据指标、SEO 和性能为基础。",
  },
  nav: {
    work: "作品",
    about: "关于",
    contact: "联系",
    menu: "菜单",
    close: "关闭",
    skipToContent: "跳到主要内容",
  },
  controls: {
    boringOn: ["直奔主题", "查看我的简历"],
    boringOff: "给我惊喜",
    boringHint: "献给喜欢直奔主题的你 ;)",
    boringTooltip: "我讨厌动画！",
    theme: "切换主题",
    language: "语言",
  },
  hero: {
    // "Designer de X" vira "我设计X" (verbo + objeto), pra manter a mesma
    // ordem visual prefixo + palavra da roleta que o resto dos idiomas usa
    // (ver SubtitleRoulette): "Designer de" na frente da palavra não soa
    // natural em chinês, mas "我设计" (eu desenho/projeto) sim.
    subtitlePrefix: "我设计",
    subtitleWords: [
      "产品",
      "体验",
      "应用",
      "界面",
      "系统",
      "音乐",
      "梦想",
      "包装",
      "网站",
    ],
    facts: [
      "UX/UI · Webapps · Design Systems",
      "从严肃到有趣，中间的一切都包含在内！",
    ],
    availability: "常驻巴西 · 面向全球接项目 🌍",
    cta: "查看我的作品",
    portraitAlt: "Armando Custodio 的黑白线条动态肖像",
  },
  cases: {
    title: "精选项目",
    interactiveExperiences: "互动体验",
    scrollHint: "滚动浏览",
    viewCase: "查看案例",
    comingSoon: "完整案例即将呈现",
    metricsDisclaimer: "示意性数据，最终数字仍在整理中。",
    fullCase: "查看完整页面",
  },
  playground: {
    title: "业余时间",
    subtitle: "插画、动画和音乐制作，滋养着我的创作的实验。",
  },
  about: {
    title: "关于",
    bio: [
      "我尝试成为一个多面手：热爱音乐，痴迷字体排印，做拼贴插画，业余时间搞音乐制作，是技术爱好者，也剪辑视频，全职保持好奇心。",
      "我热爱创作，总觉得时间不够用，想尝试的东西太多。做设计已经十年了，但故事其实开始得更早：我一直习惯把经手的一切都变成自我表达的载体。几乎涉猎过所有类型的媒介，从银行业到音乐行业，中间的一切都不例外。做东西，就是让我感到完整的事。",
      "现在，我在 AUVP 负责设计能适应真实用户需求的互动体验，一切都以数据指标、SEO 和性能为基础。我热爱我的工作，也很幸运能做自己热爱的事，也许未来我们还能一起做点什么。",
    ],
    skillsTitle: "工具与技能",
    languagesTitle: "语言",
  },
  contact: {
    title: "一起聊聊？",
    subtitle: "欢迎聊项目、合作或任何好点子。",
    emailLabel: "邮箱",
    copied: "已复制！",
    imageAlt: "跟随鼠标移动而变形的互动网格图片",
  },
  boring: {
    experienceTitle: "工作经历",
    projectsTitle: "项目与成果",
    printHint: "本页面已针对打印优化（Ctrl/Cmd + P）。",
    tableHeaders: {
      project: "项目",
      area: "领域",
      role: "职责",
      result: "成果",
    },
  },
  footer: {
    rights: "手工制作，借助机器完成。",
    backToTop: "返回顶部",
  },
};
