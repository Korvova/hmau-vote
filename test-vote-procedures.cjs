/**
 * Тестовый скрипт для проверки логики процедур голосования
 * Использование: node test-vote-procedures.cjs
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Импортируем логику из vote.cjs
const calculateDecisionLogic = (totalParticipants, totalOnlineParticipants, votesFor, votesAgainst, votesAbstain, votesAbsent, conditions, resultIfTrue) => {
  console.log('📊 Входные данные:', {
    totalParticipants,
    totalOnlineParticipants,
    votesFor,
    votesAgainst,
    votesAbstain,
    votesAbsent
  });

  const totalVotesCount = votesFor + votesAgainst + votesAbstain;

  const evaluateExpression = (elements) => {
    const stack = [];
    const operators = [];

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const value = typeof element === 'string' ? element : element.value;
      const type = typeof element === 'string' ? 'select' : element.type;

      if (value === '(') {
        operators.push(value);
      } else if (value === ')') {
        while (operators.length > 0 && operators[operators.length - 1] !== '(') {
          const op = operators.pop();
          if (['И', 'Или', 'Иначе', 'Кроме', 'AND', 'OR'].includes(op)) {
            const b = stack.pop();
            const a = stack.pop();
            if (op === 'И' || op === 'AND') stack.push(a && b);
            else if (op === 'Или' || op === 'OR') stack.push(a || b);
            else if (op === 'Иначе') stack.push(a !== b);
            else if (op === 'Кроме') stack.push(a && !b);
          } else if (['>', '<', '>=', '<=', '='].includes(op)) {
            const b = stack.pop();
            const a = stack.pop();
            if (op === '>') stack.push(a > b);
            else if (op === '>=') stack.push(a >= b);
            else if (op === '<') stack.push(a < b);
            else if (op === '<=') stack.push(a <= b);
            else if (op === '=') stack.push(a == b);
          } else {
            const b = stack.pop();
            const a = stack.pop();
            if (op === '*') stack.push(a * b);
            else if (op === '+') stack.push(a + b);
            else if (op === '-') stack.push(a - b);
            else if (op === '/') stack.push(a / b);
          }
        }
        operators.pop();
      } else if (['И', 'Или', 'Иначе', 'Кроме', 'AND', 'OR', '>', '<', '>=', '<=', '=', '*', '+', '-', '/'].includes(value)) {
        while (
          operators.length > 0 &&
          operators[operators.length - 1] !== '(' &&
          (
            (['И', 'Или', 'Иначе', 'Кроме', 'AND', 'OR'].includes(value) && ['>', '<', '>=', '<=', '=', '*', '+', '-', '/'].includes(operators[operators.length - 1])) ||
            (['>', '<', '>=', '<=', '='].includes(value) && ['*', '+', '-', '/'].includes(operators[operators.length - 1]))
          )
        ) {
          const op = operators.pop();
          if (['И', 'Или', 'Иначе', 'Кроме', 'AND', 'OR'].includes(op)) {
            const b = stack.pop();
            const a = stack.pop();
            if (op === 'И' || op === 'AND') stack.push(a && b);
            else if (op === 'Или' || op === 'OR') stack.push(a || b);
            else if (op === 'Иначе') stack.push(a !== b);
            else if (op === 'Кроме') stack.push(a && !b);
          } else if (['>', '<', '>=', '<=', '='].includes(op)) {
            const b = stack.pop();
            const a = stack.pop();
            if (op === '>') stack.push(a > b);
            else if (op === '>=') stack.push(a >= b);
            else if (op === '<') stack.push(a < b);
            else if (op === '<=') stack.push(a <= b);
            else if (op === '=') stack.push(a === b);
          } else {
            const b = stack.pop();
            const a = stack.pop();
            if (op === '*') stack.push(a * b);
            else if (op === '+') stack.push(a + b);
            else if (op === '-') stack.push(a - b);
            else if (op === '/') stack.push(a / b);
          }
        }
        operators.push(value);
      } else {
        let numValue;
        if (value === 'Все пользователи заседания') {
          numValue = totalParticipants;
        } else if (value === 'Все пользователи онлайн') {
          numValue = totalOnlineParticipants;
        } else if (value === 'Всего голосов') {
          numValue = totalVotesCount;
        } else if (value === 'За') {
          numValue = votesFor;
        } else if (value === 'Против') {
          numValue = votesAgainst;
        } else if (value === 'Воздержались') {
          numValue = votesAbstain;
        } else if (value === 'Не голосовали') {
          numValue = votesAbsent;
        } else if (type === 'input') {
          numValue = parseFloat(value);
        }
        stack.push(numValue);
      }
    }

    while (operators.length > 0) {
      const op = operators.pop();
      if (op === '(') continue;
      if (['И', 'Или', 'Иначе', 'Кроме', 'AND', 'OR'].includes(op)) {
        const b = stack.pop();
        const a = stack.pop();
        if (op === 'И' || op === 'AND') stack.push(a && b);
        else if (op === 'Или' || op === 'OR') stack.push(a || b);
        else if (op === 'Иначе') stack.push(a !== b);
        else if (op === 'Кроме') stack.push(a && !b);
      } else if (['>', '<', '>=', '<=', '='].includes(op)) {
        const b = stack.pop();
        const a = stack.pop();
        if (op === '>') stack.push(a > b);
        else if (op === '>=') stack.push(a >= b);
        else if (op === '<') stack.push(a < b);
        else if (op === '<=') stack.push(a <= b);
        else if (op === '=') stack.push(a === b);
      } else {
        const b = stack.pop();
        const a = stack.pop();
        if (op === '*') stack.push(a * b);
        else if (op === '+') stack.push(a + b);
        else if (op === '-') stack.push(a - b);
        else if (op === '/') stack.push(a / b);
      }
    }

    return stack.pop();
  };

  let finalConditionMet = true;

  for (let blockIndex = 0; blockIndex < conditions.length; blockIndex++) {
    const conditionBlock = conditions[blockIndex];
    const elements = conditionBlock.elements;
    console.log(`\n🔍 Блок ${blockIndex + 1}:`, elements);

    let condition1Met = evaluateExpression(elements);
    console.log(`   Результат блока ${blockIndex + 1}:`, condition1Met);

    let condition2Met = true;
    if (conditionBlock.operator && conditionBlock.elements2) {
      const elements2 = conditionBlock.elements2;
      console.log(`   Блок ${blockIndex + 1}.2:`, elements2);
      condition2Met = evaluateExpression(elements2);
      console.log(`   Результат блока ${blockIndex + 1}.2:`, condition2Met);

      if (conditionBlock.operator === "И" || conditionBlock.operator === "AND") {
        condition1Met = condition1Met && condition2Met;
      } else if (conditionBlock.operator === "Или" || conditionBlock.operator === "OR") {
        condition1Met = condition1Met || condition2Met;
      } else if (conditionBlock.operator === "Иначе") {
        condition1Met = condition1Met !== condition2Met;
      } else if (conditionBlock.operator === "Кроме") {
        condition1Met = condition1Met && !condition2Met;
      }
    }

    if (blockIndex === 0) {
      finalConditionMet = condition1Met;
    } else {
      const prevOperator = conditions[blockIndex - 1].operator;
      if (prevOperator === "И" || prevOperator === "AND") {
        finalConditionMet = finalConditionMet && condition1Met;
      } else if (prevOperator === "Или" || prevOperator === "OR") {
        finalConditionMet = finalConditionMet || condition1Met;
      } else if (prevOperator === "Иначе") {
        finalConditionMet = finalConditionMet !== condition1Met;
      } else if (prevOperator === "Кроме") {
        finalConditionMet = finalConditionMet && !condition1Met;
      }
    }
  }

  const decision = finalConditionMet ? resultIfTrue : (resultIfTrue === "Принято" ? "Не принято" : "Принято");
  console.log('\n✅ Итоговое решение:', decision);

  return decision;
};

// Тестовые сценарии
const runTests = async () => {
  console.log('\n===========================================');
  console.log('🧪 ТЕСТИРОВАНИЕ ЛОГИКИ ПРОЦЕДУР ГОЛОСОВАНИЯ');
  console.log('===========================================\n');

  const procedures = await prisma.voteProcedure.findMany({
    where: { id: { in: [2, 3, 4] } },
    orderBy: { id: 'asc' }
  });

  console.log('📋 Загружено процедур:', procedures.length);

  const tests = [
    // Процедура #2: Большинство от присутствующих
    {
      name: 'Тест #1: Процедура #2 - 5 ЗА 5 ПРОТИВ (10 присутствует)',
      procedureId: 2,
      totalParticipants: 38,
      totalOnlineParticipants: 10,
      votesFor: 5,
      votesAgainst: 5,
      votesAbstain: 0,
      votesAbsent: 0,
      expectedDecision: 'Не принято'
    },
    {
      name: 'Тест #2: Процедура #2 - 3 ЗА 7 ПРОТИВ (10 присутствует)',
      procedureId: 2,
      totalParticipants: 38,
      totalOnlineParticipants: 10,
      votesFor: 3,
      votesAgainst: 7,
      votesAbstain: 0,
      votesAbsent: 0,
      expectedDecision: 'Не принято'
    },
    {
      name: 'Тест #3: Процедура #2 - 6 ЗА 4 ПРОТИВ (10 присутствует)',
      procedureId: 2,
      totalParticipants: 38,
      totalOnlineParticipants: 10,
      votesFor: 6,
      votesAgainst: 4,
      votesAbstain: 0,
      votesAbsent: 0,
      expectedDecision: 'Принято'
    },
    // Процедура #3: Не менее 2/3 от установленного числа
    {
      name: 'Тест #4: Процедура #3 - 25 ЗА 13 ПРОТИВ (38 всего)',
      procedureId: 3,
      totalParticipants: 38,
      totalOnlineParticipants: 38,
      votesFor: 25,
      votesAgainst: 13,
      votesAbstain: 0,
      votesAbsent: 0,
      expectedDecision: 'Не принято'
    },
    {
      name: 'Тест #5: Процедура #3 - 26 ЗА 12 ПРОТИВ (38 всего)',
      procedureId: 3,
      totalParticipants: 38,
      totalOnlineParticipants: 38,
      votesFor: 26,
      votesAgainst: 12,
      votesAbstain: 0,
      votesAbsent: 0,
      expectedDecision: 'Принято'
    },
    {
      name: 'Тест #6: Процедура #3 - 19 ЗА 19 ПРОТИВ (38 всего)',
      procedureId: 3,
      totalParticipants: 38,
      totalOnlineParticipants: 38,
      votesFor: 19,
      votesAgainst: 19,
      votesAbstain: 0,
      votesAbsent: 0,
      expectedDecision: 'Не принято'
    },
    // Процедура #4: Большинство от установленного числа
    {
      name: 'Тест #7: Процедура #4 - 19 ЗА 19 ПРОТИВ (38 всего)',
      procedureId: 4,
      totalParticipants: 38,
      totalOnlineParticipants: 38,
      votesFor: 19,
      votesAgainst: 19,
      votesAbstain: 0,
      votesAbsent: 0,
      expectedDecision: 'Не принято'
    },
    {
      name: 'Тест #8: Процедура #4 - 20 ЗА 18 ПРОТИВ (38 всего)',
      procedureId: 4,
      totalParticipants: 38,
      totalOnlineParticipants: 38,
      votesFor: 20,
      votesAgainst: 18,
      votesAbstain: 0,
      votesAbsent: 0,
      expectedDecision: 'Принято'
    },
    {
      name: 'Тест #9: Процедура #4 - 30 ЗА 8 ПРОТИВ (38 всего)',
      procedureId: 4,
      totalParticipants: 38,
      totalOnlineParticipants: 38,
      votesFor: 30,
      votesAgainst: 8,
      votesAbstain: 0,
      votesAbsent: 0,
      expectedDecision: 'Принято'
    },
    {
      name: 'Тест #10: Процедура #4 - 18 ЗА 20 ПРОТИВ (38 всего)',
      procedureId: 4,
      totalParticipants: 38,
      totalOnlineParticipants: 38,
      votesFor: 18,
      votesAgainst: 20,
      votesAbstain: 0,
      votesAbsent: 0,
      expectedDecision: 'Не принято'
    },
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const test of tests) {
    console.log('\n' + '='.repeat(60));
    console.log(`🧪 ${test.name}`);
    console.log('='.repeat(60));

    const procedure = procedures.find(p => p.id === test.procedureId);
    if (!procedure) {
      console.error(`❌ Процедура #${test.procedureId} не найдена!`);
      failedTests++;
      continue;
    }

    const actualDecision = calculateDecisionLogic(
      test.totalParticipants,
      test.totalOnlineParticipants,
      test.votesFor,
      test.votesAgainst,
      test.votesAbstain,
      test.votesAbsent,
      procedure.conditions,
      procedure.resultIfTrue
    );

    console.log('\n📝 Ожидаемое решение:', test.expectedDecision);
    console.log('📝 Фактическое решение:', actualDecision);

    if (actualDecision === test.expectedDecision) {
      console.log('✅ ТЕСТ ПРОЙДЕН');
      passedTests++;
    } else {
      console.log('❌ ТЕСТ ПРОВАЛЕН');
      failedTests++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 ИТОГИ ТЕСТИРОВАНИЯ');
  console.log('='.repeat(60));
  console.log(`✅ Пройдено тестов: ${passedTests}`);
  console.log(`❌ Провалено тестов: ${failedTests}`);
  console.log(`📊 Всего тестов: ${tests.length}`);
  console.log('='.repeat(60) + '\n');

  await prisma.$disconnect();
  process.exit(failedTests > 0 ? 1 : 0);
};

runTests().catch(console.error);
