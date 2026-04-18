import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const templates = [
    {
      name: "세탁기",
      category: "APPLIANCE",
      icon: "🫧",
      tasks: [
        { name: "세탁조 청소", category: "CLEANING", cycleUnit: "MONTHLY", cycleEvery: 1, estimatedMinutes: 30, guideSteps: JSON.stringify(["세탁조 클리너를 세탁기에 투입한다", "고온/표준 코스로 빈 세탁을 돌린다", "완료 후 뚜껑을 열어 건조시킨다"]), productTips: JSON.stringify(["세탁조 클리너", "구연산"]) },
        { name: "필터 청소", category: "CLEANING", cycleUnit: "MONTHLY", cycleEvery: 1, estimatedMinutes: 10, guideSteps: JSON.stringify(["배수 필터 덮개를 연다", "필터를 꺼내 흐르는 물에 씻는다", "이물질 제거 후 재장착한다"]), productTips: JSON.stringify(["칫솔"]) },
      ],
    },
    {
      name: "냉장고",
      category: "APPLIANCE",
      icon: "❄️",
      tasks: [
        { name: "내부 정리 및 청소", category: "CLEANING", cycleUnit: "MONTHLY", cycleEvery: 1, estimatedMinutes: 40, guideSteps: JSON.stringify(["음식물을 모두 꺼낸다", "선반을 분리해 물로 씻는다", "내부를 베이킹소다 물로 닦는다", "음식물을 다시 정리해 넣는다"]), productTips: JSON.stringify(["베이킹소다", "행주"]) },
        { name: "코일/먼지 청소", category: "MAINTENANCE", cycleUnit: "YEARLY", cycleEvery: 1, estimatedMinutes: 20, guideSteps: JSON.stringify(["냉장고 전원을 끈다", "후면 또는 하단 코일을 진공청소기로 청소한다"]), productTips: JSON.stringify(["진공청소기 노즐"]) },
      ],
    },
    {
      name: "에어컨",
      category: "APPLIANCE",
      icon: "💨",
      tasks: [
        { name: "필터 청소", category: "CLEANING", cycleUnit: "MONTHLY", cycleEvery: 1, estimatedMinutes: 20, guideSteps: JSON.stringify(["전원을 끄고 전면 패널을 연다", "필터를 꺼내 먼지를 털어낸다", "미지근한 물로 씻고 그늘에서 완전히 건조시킨다", "장착 후 전원을 켠다"]), productTips: JSON.stringify(["부드러운 솔", "에어컨 필터 세척 스프레이"]) },
        { name: "내부 청소", category: "CLEANING", cycleUnit: "QUARTERLY", cycleEvery: 1, estimatedMinutes: 60, guideSteps: JSON.stringify(["에어컨 청소업체에 의뢰하거나 전용 세척 키트를 사용한다", "팬 및 열교환기를 청소한다"]), productTips: JSON.stringify(["에어컨 청소 스프레이 키트"]) },
      ],
    },
    {
      name: "전자레인지",
      category: "APPLIANCE",
      icon: "📡",
      tasks: [
        { name: "내부 청소", category: "CLEANING", cycleUnit: "WEEKLY", cycleEvery: 2, estimatedMinutes: 15, guideSteps: JSON.stringify(["물을 담은 그릇에 레몬즙을 넣고 3분 가열한다", "수증기로 불어난 오염을 행주로 닦아낸다", "회전 접시는 분리해 세척한다"]), productTips: JSON.stringify(["레몬", "행주"]) },
      ],
    },
    {
      name: "가스레인지",
      category: "APPLIANCE",
      icon: "🔥",
      tasks: [
        { name: "상판 청소", category: "CLEANING", cycleUnit: "WEEKLY", cycleEvery: 1, estimatedMinutes: 20, guideSteps: JSON.stringify(["버너 캡을 분리한다", "기름때 제거제를 뿌리고 10분 둔다", "스크레이퍼와 스폰지로 닦는다", "버너 캡을 세척 후 재장착한다"]), productTips: JSON.stringify(["기름때 제거제", "스크레이퍼"]) },
      ],
    },
    {
      name: "TV",
      category: "APPLIANCE",
      icon: "📺",
      tasks: [
        { name: "화면 및 먼지 닦기", category: "CLEANING", cycleUnit: "WEEKLY", cycleEvery: 2, estimatedMinutes: 10, guideSteps: JSON.stringify(["전원을 끈다", "마른 극세사 천으로 화면을 부드럽게 닦는다", "테두리와 뒷면 먼지를 제거한다"]), productTips: JSON.stringify(["극세사 천"]) },
      ],
    },
    {
      name: "공기청정기",
      category: "APPLIANCE",
      icon: "🌬️",
      tasks: [
        { name: "필터 교체", category: "REPLACEMENT", cycleUnit: "QUARTERLY", cycleEvery: 2, estimatedMinutes: 10, guideSteps: JSON.stringify(["제품 설명서를 확인한다", "필터 커버를 열어 기존 필터를 꺼낸다", "새 필터를 넣고 커버를 닫는다"]), productTips: JSON.stringify(["전용 교체 필터"]) },
      ],
    },
    {
      name: "청소기",
      category: "APPLIANCE",
      icon: "🧹",
      tasks: [
        { name: "먼지통/필터 청소", category: "CLEANING", cycleUnit: "WEEKLY", cycleEvery: 1, estimatedMinutes: 10, guideSteps: JSON.stringify(["먼지통을 분리해 비운다", "필터를 꺼내 탈탈 털거나 물세척한다", "완전히 건조 후 재장착한다"]), productTips: JSON.stringify([]) },
      ],
    },
    {
      name: "소파",
      category: "FURNITURE",
      icon: "🛋️",
      tasks: [
        { name: "먼지 및 청소", category: "CLEANING", cycleUnit: "WEEKLY", cycleEvery: 2, estimatedMinutes: 20, guideSteps: JSON.stringify(["쿠션을 분리해 털어낸다", "틈새를 진공청소기로 청소한다", "패브릭은 소파 전용 클리너로 닦는다"]), productTips: JSON.stringify(["소파 전용 클리너", "진공청소기"]) },
      ],
    },
    {
      name: "변기",
      category: "FIXTURE",
      icon: "🚽",
      tasks: [
        { name: "변기 청소", category: "CLEANING", cycleUnit: "WEEKLY", cycleEvery: 1, estimatedMinutes: 15, guideSteps: JSON.stringify(["변기 클리너를 변기 내부에 뿌린다", "변기 솔로 구석구석 닦는다", "물을 내리고 바깥 면도 소독제로 닦는다"]), productTips: JSON.stringify(["변기 클리너", "변기 솔", "소독제"]) },
      ],
    },
    {
      name: "샤워기",
      category: "FIXTURE",
      icon: "🚿",
      tasks: [
        { name: "샤워기 헤드 청소", category: "CLEANING", cycleUnit: "MONTHLY", cycleEvery: 1, estimatedMinutes: 20, guideSteps: JSON.stringify(["샤워기 헤드를 식초 물에 1시간 담근다", "칫솔로 노즐을 닦아낸다", "물로 충분히 헹군다"]), productTips: JSON.stringify(["식초", "칫솔"]) },
      ],
    },
  ];

  // 펫 아이템 템플릿
  const petTemplates = [
    {
      name: "고양이", category: "PET", icon: "🐱",
      tasks: [
        { name: "사료 주기", category: "PET_CARE", cycleUnit: "DAILY", cycleEvery: 1, estimatedMinutes: 5 },
        { name: "물 교체", category: "PET_CARE", cycleUnit: "DAILY", cycleEvery: 1, estimatedMinutes: 3 },
        { name: "화장실 청소", category: "PET_CARE", cycleUnit: "WEEKLY", cycleEvery: 1, estimatedMinutes: 15 },
        { name: "브러싱", category: "PET_CARE", cycleUnit: "WEEKLY", cycleEvery: 1, estimatedMinutes: 10 },
        { name: "미용", category: "PET_CARE", cycleUnit: "QUARTERLY", cycleEvery: 1, estimatedMinutes: 60 },
        { name: "병원 검진", category: "PET_CARE", cycleUnit: "YEARLY", cycleEvery: 1, estimatedMinutes: 60 },
      ],
    },
    {
      name: "강아지", category: "PET", icon: "🐶",
      tasks: [
        { name: "사료 주기", category: "PET_CARE", cycleUnit: "DAILY", cycleEvery: 1, estimatedMinutes: 5 },
        { name: "물 교체", category: "PET_CARE", cycleUnit: "DAILY", cycleEvery: 1, estimatedMinutes: 3 },
        { name: "산책", category: "PET_CARE", cycleUnit: "DAILY", cycleEvery: 1, estimatedMinutes: 30 },
        { name: "브러싱", category: "PET_CARE", cycleUnit: "WEEKLY", cycleEvery: 1, estimatedMinutes: 15 },
        { name: "목욕 및 미용", category: "PET_CARE", cycleUnit: "MONTHLY", cycleEvery: 1, estimatedMinutes: 60 },
        { name: "병원 검진", category: "PET_CARE", cycleUnit: "YEARLY", cycleEvery: 1, estimatedMinutes: 60 },
      ],
    },
    {
      name: "토끼", category: "PET", icon: "🐰",
      tasks: [
        { name: "사료 및 건초 주기", category: "PET_CARE", cycleUnit: "DAILY", cycleEvery: 1, estimatedMinutes: 5 },
        { name: "물 교체", category: "PET_CARE", cycleUnit: "DAILY", cycleEvery: 1, estimatedMinutes: 3 },
        { name: "케이지 청소", category: "PET_CARE", cycleUnit: "WEEKLY", cycleEvery: 1, estimatedMinutes: 20 },
      ],
    },
  ];

  // 식물 아이템 템플릿
  const plantTemplates = [
    {
      name: "고무나무", category: "PLANT", icon: "🌳",
      tasks: [
        { name: "물 주기", category: "PLANT_CARE", cycleUnit: "WEEKLY", cycleEvery: 1, estimatedMinutes: 5 },
        { name: "잎 닦기", category: "PLANT_CARE", cycleUnit: "MONTHLY", cycleEvery: 1, estimatedMinutes: 10 },
        { name: "분갈이", category: "PLANT_CARE", cycleUnit: "YEARLY", cycleEvery: 1, estimatedMinutes: 30 },
      ],
    },
    {
      name: "선인장", category: "PLANT", icon: "🌵",
      tasks: [
        { name: "물 주기", category: "PLANT_CARE", cycleUnit: "MONTHLY", cycleEvery: 1, estimatedMinutes: 3 },
      ],
    },
    {
      name: "다육이", category: "PLANT", icon: "🪴",
      tasks: [
        { name: "물 주기", category: "PLANT_CARE", cycleUnit: "WEEKLY", cycleEvery: 2, estimatedMinutes: 3 },
        { name: "분갈이", category: "PLANT_CARE", cycleUnit: "YEARLY", cycleEvery: 1, estimatedMinutes: 20 },
      ],
    },
    {
      name: "몬스테라", category: "PLANT", icon: "🌿",
      tasks: [
        { name: "물 주기", category: "PLANT_CARE", cycleUnit: "WEEKLY", cycleEvery: 1, estimatedMinutes: 5 },
        { name: "잎 닦기", category: "PLANT_CARE", cycleUnit: "MONTHLY", cycleEvery: 1, estimatedMinutes: 10 },
        { name: "분갈이", category: "PLANT_CARE", cycleUnit: "YEARLY", cycleEvery: 2, estimatedMinutes: 30 },
      ],
    },
  ];

  const spaceTaskTemplates = [
    { spaceType: "LIVING_ROOM", name: "바닥 청소기 돌리기", category: "CLEANING", cycleUnit: "WEEKLY", cycleEvery: 1, estimatedMinutes: 20 },
    { spaceType: "LIVING_ROOM", name: "바닥 물걸레질", category: "CLEANING", cycleUnit: "WEEKLY", cycleEvery: 2, estimatedMinutes: 20 },
    { spaceType: "KITCHEN", name: "싱크대 배수구 청소", category: "CLEANING", cycleUnit: "WEEKLY", cycleEvery: 1, estimatedMinutes: 10 },
    { spaceType: "KITCHEN", name: "주방 바닥 닦기", category: "CLEANING", cycleUnit: "WEEKLY", cycleEvery: 1, estimatedMinutes: 15 },
    { spaceType: "KITCHEN", name: "설거지", category: "DAILY_CHORE", cycleUnit: "DAILY", cycleEvery: 1, estimatedMinutes: 15 },
    { spaceType: "BATHROOM", name: "욕실 바닥 및 벽 청소", category: "CLEANING", cycleUnit: "WEEKLY", cycleEvery: 1, estimatedMinutes: 30 },
    { spaceType: "BATHROOM", name: "세면대 청소", category: "CLEANING", cycleUnit: "WEEKLY", cycleEvery: 1, estimatedMinutes: 10 },
    { spaceType: "BEDROOM", name: "침구 교체 및 세탁", category: "LAUNDRY", cycleUnit: "WEEKLY", cycleEvery: 2, estimatedMinutes: 30 },
    { spaceType: "BEDROOM", name: "바닥 청소기 돌리기", category: "CLEANING", cycleUnit: "WEEKLY", cycleEvery: 1, estimatedMinutes: 15 },
    { spaceType: "BALCONY", name: "베란다 쓸기", category: "CLEANING", cycleUnit: "MONTHLY", cycleEvery: 1, estimatedMinutes: 20 },
    { spaceType: "ENTRANCE", name: "현관 청소", category: "CLEANING", cycleUnit: "WEEKLY", cycleEvery: 1, estimatedMinutes: 10 },
    { spaceType: "LAUNDRY_ROOM", name: "빨래", category: "LAUNDRY", cycleUnit: "WEEKLY", cycleEvery: 1, estimatedMinutes: 10 },
    { spaceType: "HOME_ROUTINE", name: "장보기", category: "DAILY_CHORE", cycleUnit: "WEEKLY", cycleEvery: 1, estimatedMinutes: 60 },
    { spaceType: "HOME_ROUTINE", name: "분리수거", category: "DAILY_CHORE", cycleUnit: "WEEKLY", cycleEvery: 1, estimatedMinutes: 20 },
    { spaceType: "HOME_ROUTINE", name: "음식물 쓰레기 버리기", category: "DAILY_CHORE", cycleUnit: "WEEKLY", cycleEvery: 1, estimatedMinutes: 5 },
  ];

  console.log("🌱 시드 데이터 삽입 중...");

  for (const t of templates) {
    const itemTemplate = await prisma.itemTemplate.upsert({
      where: { id: t.name },
      update: {},
      create: { id: t.name, name: t.name, category: t.category, icon: t.icon },
    });

    for (const task of t.tasks) {
      await prisma.taskTemplate.create({
        data: {
          itemTemplateId: itemTemplate.id,
          name: task.name,
          category: task.category,
          defaultCycleUnit: task.cycleUnit,
          defaultCycleEvery: task.cycleEvery,
          estimatedMinutes: task.estimatedMinutes,
          guideSteps: task.guideSteps ?? null,
          productTips: task.productTips ?? null,
        },
      });
    }
  }

  // 펫/식물 템플릿 삽입
  for (const t of [...petTemplates, ...plantTemplates]) {
    const itemTemplate = await prisma.itemTemplate.upsert({
      where: { id: t.name },
      update: {},
      create: { id: t.name, name: t.name, category: t.category, icon: t.icon },
    });
    for (const task of t.tasks) {
      await prisma.taskTemplate.create({
        data: {
          itemTemplateId: itemTemplate.id,
          name: task.name,
          category: task.category,
          defaultCycleUnit: task.cycleUnit,
          defaultCycleEvery: task.cycleEvery,
          estimatedMinutes: task.estimatedMinutes,
        },
      });
    }
  }

  for (const st of spaceTaskTemplates) {
    await prisma.taskTemplate.create({
      data: {
        spaceType: st.spaceType,
        name: st.name,
        category: st.category,
        defaultCycleUnit: st.cycleUnit,
        defaultCycleEvery: st.cycleEvery,
        estimatedMinutes: st.estimatedMinutes,
      },
    });
  }

  console.log("✅ 시드 데이터 삽입 완료!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
