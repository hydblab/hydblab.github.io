---
layout: post
title: "파이썬스러운 객체"
author: "sungsoo"
--- 


## 챕터 요약

- repr(), bytes() 등 객체를 다른 방식으로 표현하는 내장 함수의 지원
- 클래스 메서드로 대안 생성자 구현
- format() 내장함수와 str.format() 메서드에서 사용하는 포맷 언어 확장
- 읽기 전용 접근만 허용하는 속성 제공
- 집합 및 딕셔너리 키로 사용할 수 있도록 객체를 해시 가능하게 만들기
- __slots__를 이용해서 메모리 절약하기
- 파이썬스러움이란 뭘까.
-- 단순함 > 복잡함
-- 구현에 있어서 언어의 모든 기능을 갖출 필요는 없다
-- 다양한 객체 표현 + 특별 메서드를 이용한 객체 고유의 포맷 코드 구현 + 속성 노출 제한, hash()


## 객체 표현
- repr() : 객체를 개발자가 보고자 하는 형태로 표현한 문자열로 반환
- str() : 객체를 사용자가 보고자 하는 형태로 표현한 문자열로 반환
- __repr__() 과 __str__() 특별 메서드를 직접 구현한다.

{% highlight python %}

class Vector2d:
    typecode = 'd'

    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __iter__(self):
        return (i for i in range(self.x, self.y))

    def __repr__(self):
        return 'x = '+str(self.x) + ', y = '+str(self.y)

    def __str__(self):
        return str(tuple(self))

    def __eq__(self, other):
        return tuple(self) == tuple(other)

    def __abs__(self):
        return math.hypot(self.x, self.y)

    def __bool__(self):
        return bool(abs(self))

    def __bytes__(self):
        return bytes(array(self.typecode, self))


v1 = Vector2d(3, 4)
octets = bytes(v1)

print(v1.x, v1.y)  # 3, 4
print(v1)       # (3,4)
print(repr(v1))     # x = 3, y = 4
print(abs(v1))  # 5.0
print(octets)  # b'\x00\x00\x00\x00\x00\x00\x08@'

{% endhighlight %}


## @classmethod 와 @staticmethod

{% highlight python %}
class Demo:
    @classmethod
    def klassmeth(*args):
        return args

    @staticmethod
    def statmeth(*args):
        return args

print(Demo.klassmeth())  # (<class '__main__.Demo'>,)       
print(Demo.klassmeth('test'))   # (<class '__main__.Demo'>, 'test')

print(Demo.statmeth())  # ()
print(Demo.statmeth('test'))  # ('test',)

{% endhighlight %}

- staticmethod 데커레이터는 그리 유용하지 않고 차라리 모듈 수준의 함수를 사용하는 것이 더 간단하다
- classmethod 는 객체가 아닌 클래스 연산을 수행하는 메서드를 정의한다. (우리가 알고 있는 정적 메서드)
- classmethod 는 클래스를 첫 번째 인수로 받는다.
- staticmethod 는 평범한 함수처럼 동작한다.

## 포맷된 출력

{% highlight python %}

brl = 1 / 2.43

print(brl)      # 0.4115226337448559
print(format(brl, "0.4f"))  # 0.4115
print('1 BRL = {rate:0.2f}'.format(rate=brl))  # 1 BRL = 0.41
print(format(2 / 3, '.1%'))  # 66.7%
print(format(42, 'b'))       # 101010


now = datetime.now()

print(format(now, '%Y-%M-%d'))  # 2018-36-19
print("It's now {:%I %M %p}".format(now))       #It's now 06 37 PM

{% endhighlight %}

- 포맷명시자와 대체 필드를 활용해서 구현이 가능하다.


## 비공개 속성과 보호된 속성
- 파이썬은 private 와 같은 접근 제어자가 없다.
- 속성명을 두개의 언더바로 시작하고 언더바 없이 또는 하나의 언더바로 끝나도록 정의하면, 파이썬은 __dict__에 저장된다.
-- dict 에 저장된 속성은 클래스 명이 붙어, 상속의 경우 속성값의 변경으로 인한 충돌을 방지할 수 있다.
- 단일 언더바로 시작하는 속성을 보호된 속성이라고 부른다. 
- 보호된 속성은 관례일 뿐이다.

{% highlight python %}

print(v1.__dict__)      # {'x': 2, 'y': 3}

def __init__(self, x, y):
        self.__x = x
        self.__y = y
v1 = Vector2d(2, 3)
print(v1.__dict__)      # {'_Vector2d__x': 2, '_Vector2d__y': 3}

{% endhighlight %}

## 해시가 가능하도록 만든 객체
{% highlight python %}

def __init__(self, x, y):           
    self.__x = x
    self.__y = y

@property
def x(self):
    return self.__x

@property
def y(self):
    return self.__y

def __hash__(self):
    return hash(self.x) ^ hash(self.y)
    

v1=Vector2d(3,4)
hash(v1)
set([v1])
{% endhighlight %}
## __slots__ 클래스 속성으로 공간 절약하기
- 파이썬은 객체 속성을 각 객체 안의 __dict__라는 딕셔너리형 속성에 저장한다.
- 딕셔너리형은 빠른 접근속도를 자랑하지만 내부에 해시테이블 유지로 인해 메모리 사용량 부담이 크다.
- 파이썬의 속성 관리를 딕셔너리가 아닌 튜플로 저장하게 하여 공간을 절약해보자
- 사용법은 아래와 같다.
{% highlight python %}

class Vector2d:
    __slots__ = ('__x','__y')
    ..

{% endhighlight %}

- slots은 상속된 slots 속성을 무시하므로, 상속을 할 경우 각 클래스마다 __slots__를 재정의 해야 한다.
- 메모리 절감효과가 있지만 나열된 속성만 가질 수 있다.
- 객체가 유지하고 싶은 또 다른 특별 속성이 있을 경우 약한 참조가 필요한데, 약한 참조의 대상이 되게 하려면 __weakref__를 __slots__ 리스트에 추가해야 한다.
- 객체 1천 만 개(Vector2d를 예로) 를 생성했을 때 dict의 메모리는 1.5GB 의 메모리를 사용하지만, slots은 655MB 수준으로 절감된 효과를 보였다.

## 클래스 속성 오버라이드
{% highlight python %}
from vector2d_v3 import Vector2d

v1 = Vector2d(1.1, 2.2)
dumpd = bytes(v1)       
print(dumpd)    #b'\x00\x00\x00\x00\x00\x00\xf0?'

v1.typecode = 'f'   # 객체의 속성을 추가하는 것이다.  self.typecode = Vector2d.typecode를 의미
dumpd2 = bytes(v1)
print(dumpd2)   #b'\x00\x00\x80?'
print(Vector2d.typecode)    #'d'
{% endhighlight %}

- 파이썬은 클래스 속성값을 객체 속성의 기본값으로 사용한다.
- 클래스의 속성은 모든 서브클래스가 상속하므로, 클래스 데이터 속성을 커스터마이즈할 때, 클래스를 상속하는 것이 일반적이다.
- 객체의 속성을 생성해서 오버라이드 하는 방법과 클래스를 상속 받음으로써 클래스 수준에서 덮어쓰는 방법이 있다.


{% highlight python %}
class ShortVector2d(Vector2d):
    typecode = 'f'  # typecode 클래스 속성만 덮어 쓰는 것이다.

sv = ShortVector2d(1, 2)
dumpd = bytes(sv)
print(dumpd)    #b'\x00\x00\x80?'       

{% endhighlight %}
