---
layout: post
title: "Data model"
author: "badhorror"
---
# 파이썬 데이터 모델

## 특별 메소드
- 반복
- 컬렉션
- 속성접근
- 연산자 오버로딩
- 함수 및 메서드 호출
- 객체 생성 및 제거
- 문자열 표현 및 포맷
- 블록 등 콘텍스트 관리



```python
import collections

Card = collections.namedtuple('Card', ['rank', 'suit'])

class FrenchDeck:
    ranks = [str(n) for n in range(2, 11)] + list('JQKA')
    suits = 'spades diamonds clubs hearts'.split()
    def __init__(self):
        self._cards = [Card(rank, suit) for suit in self.suits
                                        for rank in self.ranks]
    def __len__(self):
        return len(self._cards)
    def __getitem__(self, position):
        return self._cards[position]

```

- collections.namedtuple로 클래스 구현


```python
beer_card = Card('7','diamond')
beer_card
```




    Card(rank='7', suit='diamond')




```python
deck = FrenchDeck()
print(deck[0])
print(len(deck))
from random import choice
print(choice(deck))
```

    Card(rank='2', suit='spades')
    52
    Card(rank='J', suit='hearts')


- FrenchDeck은 특별메소드를 이용해서 구현했다
    - \_\_len\_\_ , \_\_getitem\_\_
    - 특별메소드 장점
        - 메소드 암기가 필요없다
        - 파이썬 표준라이브러리 제공 기능 바로 사용가능


## 특별 메소드

- 인터프리터가 호출하기 위해 존재
```py
    object.__len__
    len(object)
```
- 구현은 \_\_len\_\_이지만 호출은 len()


```python
from math import hypot
class Vector:
    def __init__(self, x=0, y=0):
        self.x = x
        self.y = y
    def __repr__(self):
        return 'Vector(%r, %r)' % (self.x, self.y)
    def __abs__(self):
        return hypot(self.x, self.y)
    def __bool__(self):
        return bool(abs(self))
    def __add__(self, other):
        x = self.x + other.x
        y = self.y + other.y
        return Vector(x, y)
    def __mul__(self, scalar):
        return Vector(self.x * scalar, self.y * scalar)

v1 = Vector(2,4)
v2 = Vector(2,1)
print(v1)
print(v2)
print(v1+v2)
print(abs(Vector(3,4)))
print(abs(Vector(3,4) * 3))

```

    Vector(2, 4)
    Vector(2, 1)
    Vector(4, 5)
    5.0
    15.0


- 문자열 표현
    - repr 특별 메서드는 객체를 문자로 표현할때 사용한다
    - 정의가 안되있으면 &lt;vector object=""&gt; 같은 형태로 출력됨
- 산술연산자
    - abs, add, mul 등
- 특별메서드를 사용해서 파이썬스러운 코딩 스타일을 지원한다
