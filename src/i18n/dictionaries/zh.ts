import type { Dictionary } from "./pt";

export const zh: Dictionary = {
  meta: {
    title: "Armando Custodio, Design Engineer",
    description: "从银行到音乐的互动体验，始终以数据指标、SEO 和性能为基础。",
  },
  nav: {
    home: "首页",
    work: "作品",
    about: "关于",
    contact: "联系",
    menu: "菜单",
    close: "关闭",
    skipToContent: "跳到主要内容",
    menuDescriptions: {
      home: "你很喜欢看我转圈吧。",
      work: "解决真实问题的界面设计，从银行业到音乐产业。",
      playground: "插画、动画和音乐制作，滋养创作的实验场。",
      about: "音乐、字体排印、拼贴和技术，样样都沾一点，随时随地。",
      contact: "欢迎聊项目、合作或任何好点子。",
    },
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
    scrollHint: "滚动浏览",
    viewCase: "查看案例",
    comingSoon: "完整案例即将呈现",
    repo: "仓库",
    openDemo: "在新标签页打开",
    metricsDisclaimer: "示意性数据，最终数字仍在整理中。",
  },
  brands: {
    title: "认可我的作品",
  },
  playground: {
    title: "花絮",
    subtitle: "插画、动画和音乐制作，滋养着我的创作的实验。",
  },
  about: {
    title: "关于",
    bio: [
      "我是全天候的好奇心持有者，样样都沾一点：热爱音乐、做插画、是技术爱好者，也痴迷各种奇怪的冷知识，十年前就把创作的冲动变成了职业。",
      "目前，我是一家银行的产品设计师（好奇的话可以猜猜是哪家），为世界各地的客户打造互动体验，专注于用户的真实需求，始终以数据、SEO、性能和绝佳的审美（我自己的）为指导。",
      "我热爱我做的事，也很幸运能做自己热爱的事，也许未来我们还能一起做点什么。",
    ],
    skillsTitle: "工具与技能",
    skillsOrbitMessage: "不会的话，我就钻研到会为止！",
    languagesTitle: "语言",
  },
  contact: {
    title: "一起聊聊？",
    subtitle: "欢迎聊项目、合作或任何好点子。",
    emailLabel: "邮箱",
    copied: "已复制！",
    imageAlt: "跟随鼠标移动而变形的互动网格图片",
    gridWords: ["跟我", "聊聊！"],
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
