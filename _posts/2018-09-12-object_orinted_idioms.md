---
layout: post
title: "객체지향 관용구"
author: "Polishedwh"
---

## 파이썬 변수는 객체이다.

### 변수 복사
- 파이썬에서 변수 복사는 참조된 메모리의 주소 복사 형식이다.
  - 파이썬에서 변수는 객체이고 객체가 저장된 메모리 주소가 변수에 담긴다.

{% highlight python %}
>>> a = [1, 2, 3]
>>> b = a
>>> a.append(4)
>>> b
[1, 2, 3, 4]
{% endhighlight %}

- 변수에 할당하기 전에 객체가 생성된다.
  - 우측 동작부터 평가 한다.

{% highlight python %}
class Gizmo:
    def __init__(self):
        print('Gizmo id: %d' % id(self))

>>> x = Gizmo()
Gizmo id: 4301489152
>>> y = Gizmo() * 10
Gizmo id: 4301489432
Traceback (most recent call last):
    File "<stdin>", line 1, in <module>
TypeError: unsupported operand type(s) for \*: 'Gizmo' and 'int'
>>> dir()
['Gizmo', '__builtins__', '__doc__', '__loader__', '__name__', '__package__', '__spec__', 'x']
{% endhighlight %}

#### 정체성, 동질성, 별명
- 정체성
  - 생성된 객체의 메모리 주소를 말한다.

- 동질성
  - 값이 같은 것과 같은 객체를 가리키는 변수가 두 개 인것은 다르다.

- 별명
  - 객체 주소를 가리키는 변수를 말한다.

- id()함수로 변수에 담긴 객체의 메모리 주소를 확인 할 수 있다.
  - id()함수가 리턴하는 값은 인터프리터에 따라 다르다.
  - CPython은 메모리 주소를 리턴한다.
  - is, is not을 사용하자.

- 같은 주소를 갖는 변수 두개를 보인다.

{% highlight python %}
>>> charles = {'name': 'Charles L. Dodgson', 'born': 1832}
>>> lewis = charles
>>> lewis is charles
True
>>> id(charles), id(lewis)
    (4300473992, 4300473992)
    >>> lewis['balance'] = 950
    >>> charles
{'name': 'Charles L. Dodgson', 'balance': 950, 'born': 1832}
{% endhighlight %}

- 값이 같은 것과 같은 객체를 가리키는 것은 다르다.

{% highlight python %}
>>> alex = {'name': 'Charles L. Dodgson', 'born': 1832, 'balance': 950}
>>> alex == charles
True
>>> alex is not charles
True
{% endhighlight %}

#### ==, is 연산자 선택
- == 연산자는 값 비교 연산자 이다.
  - a==b -> a.__eq__(b)와 같다. (syntactic sugar)
- is 연산자는 객체 주소를 비교한다.
  - == 연산자와 달리 특별 메소드를 호출 하지 않기 때문에 더 빠르다.
  - is 연산자는 오버로딩 할 수 없다. 
  - 객체가 None인지 확인하려면 is None, is not None 을 사용한다.

#### 튜플의 상대적 불변성
- 튜플도 객체에 대한 참조를 갖는 자료 형식이다.
  - lists, dicts, sets 등도 객체의 참조를 담는다.
- 튜플 구성 객체의 메모리 주소는 변경 할 수 없다.
- t1=(1, 3, [30, 40]) 와 같이 튜플 내에 가변 객체가 있다면 가변 객체에 접근해 값을 더하거나 뺄 수 있다.
- t1[0]/1, t1[1]/3, t1[2]/[30, 40]을 지칭하고 있고 t1은 불변 객체이지만 t[2]는 가변 객체이기 때문에 메모리를 참조해 수정할 수 있다.

{% highlight python %}
>>> t1 = (1, 2, [30, 40])
>>> t2 = (1, 2, [30, 40])
>>> t1 == t2
True
>>> id(t1[-1])
4302515784
>>> t1[-1].append(99)
>>> t1
(1, 2, [30, 40, 99])
>>> id(t1[-1])
4302515784
>>> t1 == t2
False
{% endhighlight %}

#### 얕은 복사
- 얕은 복사는 객체만 새로 생성하고 <U>내부 데이터는 복사될 당시의 데이터를 레퍼런스로</U> 가지고 있다.
- list(), [:]. copy() 등은 얕은 복사를 한다.

{% highlight python %}
>>> l1 = [3, [55, 44], (7, 8, 9)]
>>> l2 = list(l1)
>>> l2
[3, [55, 44], (7, 8, 9)]
>>> l2 == l1
True
>>> l2 is l1
False
{% endhighlight %}

- [shallow copy example]

{% highlight python %}
l1 = [3, [66, 55, 44], (7, 8, 9)]
l2 = list(l1)
l1.append(100)
l1[1].remove(55)
print('l1:', l1)
print('l2:', l2)
l2[1] += [33, 22]
l2[2] += (10, 11)
print('l1:', l1)
print('l2:', l2)
{% endhighlight %}

- **주의**
- python tutor애니메이션으로 살펴보면 list()로 복사될 때 튜플 객체의 메모리가 새로 생성되는 것 처럼 설명한다.
- id로 확인한 주소는 값 변경 후 변경되었다. (py 3.6기준)

{% highlight python %}
>>> l1 = [3, [55, 44], (7, 8, 9)]
>>> l2 = list(l1)
>>> id(l1[0])
224045491104
>>> id(l2[0])
224045491104
>>> l1[0]=1
>>> id(l1[0])
224045491040
>>> id(l2[0])
224045491104
>>> id(l1[1])
140318817281352
>>> id(l2[1])
140318817281352
>>> id(l1[2])
140318817286472
>>> id(l2[2])
140318817286472
{% endhighlight %}

#### 깊은 복사
- deepcopy 모듈을 사용해서 메모리를 모두 복사한다. 
- 순환 참조된 데이터 까지 복사 할 수 있다. 
- 순환 참조 와 같은 이유로 깊은 복사를 직접 구현하는 것은 쉽지 않다.

- 깊은 복사의 예
  - 예제 class
  {% highlight python %}
class Bus:

    def __init__(self, passengers=None):
        if passengers is None:
            self.passengers = []
        else:
            self.passengers = list(passengers)

    def pick(self, name):
        self.passengers.append(name)

    def drop(self, name):
        self.passengers.remove(name)
{% endhighlight %}

  - 얕은 복사와 깊은 복사의 차이 
  {% highlight python %}
>>> import copy
>>> bus1 = Bus(['Alice', 'Bill', 'Claire', 'David'])
>>> bus2 = copy.copy(bus1) # 얕은 복사
>>> bus3 = copy.deepcopy(bus1) # 깊은 복사
>>> id(bus1), id(bus2), id(bus3)
(4301498296, 4301499416, 4301499752)
>>> bus1.drop('Bill') # bus1에서 drop 했는데
>>> bus2.passengers
['Alice', 'Claire', 'David'] # bus2에서도 drop 되었다.
>>> id(bus1.passengers), id(bus2.passengers), id(bus3.passengers)
(4302658568, 4302658568, 4302657800)
>>> bus3.passengers
['Alice', 'Bill', 'Claire', 'David'] # bus3에서는 drop 되지 않았다.
{% endhighlight %}

  - deepcopy모듈을 이용한 순환 참조데이터 복사 예
  {% highlight python %}
>>> a = [10, 20]
>>> b = [a, 30]
>>> a.append(b)
>>> a
[10, 20, [[...], 30]]
>>> from copy import deepcopy
>>> c = deepcopy(a)
>>> c
[10, 20, [[...], 30]]
{% endhighlight %}

<hr>
## 참조로서의 함수 매개변수
- 파이썬에서 매개변수 호출 방식은 공유 호출(call by sharing) 방식을 기본으로 사용한다.
    - 넘겨 받은 매개변수는 레퍼런스로 동작한다. call 주체가 알려준 메모리 공간의 값이 변경된다.
- 8-11 예제와 같이 넘겨준 매개변수의 자료형에 따라 상이하게 동작한다(덕타이핑)

{% highlight python %}
>>> def f(a, b):
        a += b
        return a
>>> x = 1
>>> y = 2
>>> f(x, y)
3
>>> x, y
(1, 2) # x값이 변경되지 않았다.
>>> a = [1, 2]
>>> b = [3, 4]
>>> f(a, b)
[1, 2, 3, 4]
>>> a, b
([1, 2, 3, 4], [3, 4]) # a 리스트가 변경되었다. 
>>> t = (10, 20)
>>> u = (30, 40)
>>> f(t, u)
(10, 20, 30, 40)
>>> t, u
((10, 20), (30, 40)) # t 튜플이 변경되지 않았다.
{% endhighlight %}

### 가변형을 매개변수 기본값으로 사용하기: 좋지 않은 생각

- 가변형을 매개변수 기본값으로 사용했을 때의 예
  - 기본 값을 공유한다.
    - 기본 값이 함수가 선언 될 때 평가되기 때문이다.(예를들어 모듈이 로드 될 때)
    - 평가된 기본 값은 함수 객체의 속성이 된다. 

  - class
  {% highlight python %}
class HauntedBus:
    """A bus model haunted by ghost passengers"""

    def __init__(self, passengers=[]):
        self.passengers = passengers # 매개 변수가 넘어오지 않았을 때 파라미터 변수를 기본 객체로 사용한다.
                                     # self.passengers는 passengers 객체의 별명이 된다. 
    def pick(self, name):
        self.passengers.append(name) # 비어있는 파라미터 객체를 조작한다.

    def drop(self, name):
        self.passengers.remove(name) # 비어있는 파라미터 객체를 조작한다.
{% endhighlight %}

  - call
  {% highlight python %}
>>> bus1 = HauntedBus(['Alice', 'Bill']) # bus1 객체에 alice, bill을 넣었다.
>>> bus1.passengers
['Alice', 'Bill']
>>> bus1.pick('Charlie')
>>> bus1.drop('Alice')
>>> bus1.passengers
['Bill', 'Charlie']
>>> bus2 = HauntedBus() # 기본 객체(list)가 할당됨
>>> bus2.pick('Carrie')
>>> bus2.passengers
['Carrie']
>>> bus3 = HauntedBus() # 기본 객체(list)가 할당됨
>>> bus3.passengers # 기본 리스트가 비어있지 않음
['Carrie']
>>> bus3.pick('Dave')
>>> bus2.passengers
['Carrie', 'Dave']
>>> bus2.passengers is bus3.passengers
True
>>> bus1.passengers
['Bill', 'Charlie']
{% endhighlight %}

  - defaults
  {% highlight python %}
>>> dir(HauntedBus.__init__) # doctest: +ELLIPSIS
['__annotations__', '__call__', ..., '__defaults__', ...]
>>> HauntedBus.__init__.__defaults__
(['Carrie', 'Dave'],) # __defaults__에 값이 들어있다
{% endhighlight %}

  - verify
  {% highlight python %}
 # HauntedBus Class의 defaults와 bus2객체의  passengers 필드가 같은 메모리를 참조하고 있다.
>>> HauntedBus.__init__.__defaults__[0] is bus2.passengers True
{% endhighlight %}

### 가변 매개변수 문제에 대한 방어적 프로그래밍
- 가변 매개변수의 기본값은 None으로 사용
  - __init__이 None일때 빈 리스트를 새로 생성한다.
  - None이 아닐때 사용자가 넘겨준 변수을 레퍼런스로 사용기 때문에 사용자가 넘겨준 데이터가 로직에 따라 변경된다. 

- call by value 처럼 사용하고 싶다면?
  - __init__에서 None이 아닐경우 얕은복사로 값을 복사해서 쓴다.
  - 사용자가 넘겨준 값은 변경되지 않고 함수 내부 로직에서만 사용할 수 있다. (지역변수)

- 사용자의 데이터가 바뀌는 예

{% highlight python %}
>>> basketball_team = ['Sue', 'Tina', 'Maya', 'Diana', 'Pat']
>>> bus = TwilightBus(basketball_team)
>>> bus.drop('Tina')
>>> bus.drop('Pat')
>>> basketball_team
['Sue', 'Maya', 'Diana'] # 사용자의 원본 데이터가 비뀌었다.
{% endhighlight %}

- 기본값을 None으로 사용했을 때의 예

{% highlight python %}
class TwilightBus:
    """A bus model that makes passengers vanish"""
    def __init__(self, passengers=None):
        if passengers is None:
            self.passengers = []

        else:
            self.passengers = passengers # 원본 데이터의 별명이 된다.

    def pick(self, name):
        self.passengers.append(name)

    def drop(self, name):
        self.passengers.remove(name)
{% endhighlight %}

- 사용자의 데이터를 복사하는 예 
  - 가변 매개변수를 인자로 준다면 __init__을 오버라이드 해줘야 할 것 같은데, 좀 더 편리한 방법은 못찾았다.

{% highlight python %}
def __init__(self, passengers=None):
    if passengers is None:
        self.passengers = []

    else:
        self.passengers = list(passengers) # iterable 자료형 모두에 사용 할 수 있다.
{% endhighlight %}
<hr>

##  del과 가비지 컬렉션
- del은 레퍼런스가 할당된 별명을 제거하는 것이다.
  - 객체(메모리)가 바로 제거되는 것이 아니다.
- 가비지 컬렉션
  - 참조하는 객체가 없거나 unreachable이라고 판단될 때 메모리를 해제한다.
    - 객체(메모리관점)는 refcount를 가지고, 참조하는 변수가 없다면 refcount는 0이 된다.
    - 순한참조는unreachable로 판단한다.

  - **주의** : CPython은 refcount가 0인 객체의 __del__ 을 호출해서 삭제한다.
    Chython 버전별로 동작은 상이하므로 하므로 refcount가 있고 메모리가 바로 해제되지 않는다 정도만 알아두자. 

{% highlight python %}
>>> import weakref
>>> s1 = {1, 2, 3}
>>> s2 = s1
>>> def bye():
        print('Gone with the wind...')
>>> ender = weakref.finalize(s1, bye) # 메모리가 제거될 때 bye를 출력하도록 callback 등록한다.(약한참조)
>>> ender.alive
True
>>> del s1 # 변수 s1 {1, 2, 3}객체(referent)로부터 제거
>>> ender.alive # s1이 제거됐지만 s2가 남았기 때문에 아직 살아있다.
True
>>> s2 = 'spam' # s2변수를 객체 'spam'으로 rebinding 했다.
Gone with the wind...  # 남아있던 s2도 {1, 2, 3}을 참조하지 않으므로 {1, 2, 3}객체가 제거됐다.
>>> ender.alive
False
{% endhighlight %}

<hr>
## 약한참조
- 객체를 참조하고 있어도 refcount에는 반영되지 않는다.
- 약한참조를 하고있다고 해도 refcount에 반영되지 않기 때문에 가비지컬렉션된다.
- 캐시 등에 주로 쓰이는 형태 이다.
- weakref.ref 모듈을 직접쓰기보다는 weakkeydictionary, weakvaluedictionary, weakset, finalize()를 이용하는게 좋다.
  - weakref는 low-level 인터페이스이다.

{% highlight python %}
>>> import weakref
>>> a_set = {0, 1}
>>> wref = weakref.ref(a_set) # 약한 참조 생성
>>> wref
<weakref at 0x100637598; to 'set' at 0x100636748>
>>> wref()
{0, 1}
>>> a_set = {2, 3, 4} # a_set 변수를 {2, 3, 4}로 rebinding
>>> wref()
{0, 1}
>>> wref() is None # {0, 1} referent가 제거 되었다.
False
>>> wref() is None
True
{% endhighlight %}

### WeakValueDictionary
- WeakValueDictionary
- 약한 참조를 값으로 가지는 가변 매핑 클래스이다. 
  - 매핑된 가변 객체가 garbage collect되면 매핑되었던 키가 사라진다.
  - 일반적으로 캐시 구현을 위해 사용한다.
  - 예제에서 for loop를 이용할때 전역변수를 사용했기 때문에(참조) 삭제되지 않은 요소가 남을 수 있다.

  - class
  {% highlight python %}
class Cheese:
    def __init__(self, kind):
        self.kind = kind

    def __repr__(self):
        return 'Cheese(%r)' % self.kind
{% endhighlight %}

  - call
  {% highlight python %}
>>> import weakref
>>> stock = weakref.WeakValueDictionary() # 약한 참조를 생성한다.
>>> catalog = [Cheese('Red Leicester'), Cheese('Tilsit'),
                  Cheese('Brie'), Cheese('Parmesan')] # cheese 객체 리스트를 생성한다.

>>> for cheese in catalog:
        stock[cheese.kind] = cheese # WeakValueDictionary 매핑한다.

>>> sorted(stock.keys())
['Brie', 'Parmesan', 'Red Leicester', 'Tilsit']
>>> del catalog # 객체 리스트를 참조하던 변수를 삭제한다.
>>> sorted(stock.keys()) # 위 loop의 cheese가 루프 동작 마지막 요소를 참조하고 있어 garbage collection되지 못한 객체가 있다.
['Parmesan']
>>> del cheese # 삭제한다. 
>>> sorted(stock.keys()) # garbage collection 되었다.
[]
{% endhighlight %}

- WeakKeyDictionary, WeakSet 등도 있다.

##  약한 참조의 한계
- 모든 객체(또는 referent)에 WeakRef를 사용 할 수 있는 것은 아니다.
  - 기본 list,  dict, int, tuple은 사용할 수 없다.
  - set 인스턴스, 사용자 지정 타입은 사용할 수 있다.
    - 위 예제에서 Cheese 클래스가 필요했던 이유(subclass)
  - int, tuple 객체는 subclass로 만들어도 사용 할 수 없다.

  - list, dict를 위한 subclass 사용 예
{% highlight python %}
class MyList(list):
    """list subclass whose instances may be weakly referenced"""
a_list = MyList(range(10))

 # a_list can be the target of a weak reference
wref_to_a_list = weakref.ref(a_list)
{% endhighlight %}


[shallow copy example]: http://www.pythontutor.com/visualize.html#code=l1%20%3D%20%5B3,%20%5B66,%2055,%2044%5D,%20%287,%208,%209%29%5D%0Al2%20%3D%20list%28l1%29%0Al1.append%28100%29%0Al1%5B1%5D.remove%2855%29%0Aprint%28'l1%3A',%20l1%29%0Aprint%28'l2%3A',%20l2%29%0Al2%5B1%5D%20%2B%3D%20%5B33,%2022%5D%0Al2%5B2%5D%20%2B%3D%20%2810,%2011%29%0Aprint%28'l1%3A',%20l1%29%0Aprint%28'l2%3A',%20l2%29&cumulative=false&curInstr=1&heapPrimitives=nevernest&mode=display&origin=opt-frontend.js&py=3&rawInputLstJSON=%5B%5D&textReferences=false
