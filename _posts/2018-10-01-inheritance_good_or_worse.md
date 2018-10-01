---
layout: post
title: "내장 자료형 상속과 다중 상속"
author: "Polishedwh"
---

## 내장 자료형의 상속
- Python 2.2 이전
  - list, dict 등 내장 자료형을 상속 할 수 없다.

- Python 2.2 이후
  - 내장 자료형을 상속 할 수 있다. 

- **주의**
  - C 언어로 작성된 내장 클래스의 코드는 사용자가 오버라이드한 코드를 호출하지 않는다.
    - CPython에서 명확하게 호출되는지 호출되지 않는지를 정의하지는 않았다.
    - <U>일반적으로 사용자가 오버라이드한 내장 메서드를 같은 객체 내의 다른 내장 메서드가 사용하지 않는다.</U>

{% highlight python %}
>>> class DoppelDict(dict):
...    def __setitem__(self, key, value):
...        super().__setitem__(key, [value] * 2) # 값 복제
...
>>> dd = DoppelDict(one=1) # __init__()은 오버라이드된 __setitem__()을 무시한다.
>>> dd
{'one': 1} # 값이 복제되지 않음
>>> dd['two'] = 2 # []는 오버라이드된 __setitem__()을 호출
>>> dd
{'one': 1, 'two': [2, 2]} # 값이 복제됨
>>> dd.update(three=3) # dict 클래스의 update 메서드는 오버라이드된 __setitem__()을 무시한다.
>>> dd
{'three': 3, 'one': 1, 'two': [2, 2]} # 값이 복제되지 않음
{% endhighlight %}

- 객체지향 프로그래밍의 기본 규칙을 어기는 상황이다. 
  - 규칙  
    - 메서드 검색은 대상 객체(self)의 클래스에서 시작한다. 
    - 오버라이드된 코드를 슈퍼클래스의 메서드에서 호출 했을지라도 대상 객체의 클래스에서부터 검색한다.
  - Note
    - 슈퍼클래스에서 호출해도 오버라이드된 메서드를 사용한다는 의미로 해석함

{% highlight python %}
>>> class AnswerDict(dict):
...    def __getitem__(self, key):
...        return 42
...
>>> ad = AnswerDict(a='foo')
>>> ad['a'] #
42
>>> d = {}
>>> d.update(ad) # 오버라이드된 __getitem__() 메서드를 무시한다.
>>> d['a'] #
'foo'
>>> d
{'a': 'foo'}
{% endhighlight %}

- collections 모듈을 상속받아 사용한다. 

{% highlight python %}
>>> import collections
>>>
>>> class DoppelDict2(collections.UserDict):
...    def __setitem__(self, key, value):
...        super().__setitem__(key, [value] * 2)
...
>>> dd = DoppelDict2(one=1)
>>> dd
{'one': [1, 1]}
>>> dd['two'] = 2
>>> dd
{'two': [2, 2], 'one': [1, 1]}
>>> dd.update(three=3) # 오버라이드된 __setitem__() 메서드가 사용되었다.
>>> dd
{'two': [2, 2], 'three': [3, 3], 'one': [1, 1]}
>>>
>>> class AnswerDict2(collections.UserDict):
...    def __getitem__(self, key):
...        return 42
...
>>> ad = AnswerDict2(a='foo')
>>> ad['a']
42
>>> d = {}
>>> d.update(ad)
>>> d['a']
42
>>> d
{'a': 42}
{% endhighlight %}

- **의문**: 서로 다른 클래스로 만든 객체이고 오버라이드된 클래스를 상속받은 것도 아니라서 동작에는 문제가 없다고 보는데 부연 설명하는 이유를 잘 모르겠음. 

  - 책에서 언급한 공식 문서
    - pypy, CPython이 서로 다른결과가로 나타난다는 내용

  {% highlight python %}
class D(dict):
    def __getitem__(self, key):
        return "%r from D" % (key,)

class A(object):
    pass

a = A()
a.__dict__ = D()
a.foo = "a's own foo"
print a.foo
# CPython => a's own foo
# PyPy => 'foo' from D

glob = D(foo="base item")
loc = {}
exec "print foo" in glob, loc
# CPython => base item
# PyPy => 'foo' from D
{% endhighlight %}


## 다중 상속과 메서드 결정 순서
- MRO(Method Resolution Order)
  - 파이썬의 메소드 결정 순서를 말한다.
  - __mro__속서에 저장한다.
  - 현재 클래스부터 객체까지 슈퍼클래스들의 MRO를 튜플로 저장한다.
  - C3알고리즘을 사용한다.
    - UML상속그래프, 클래스 정의에서 작성된 순서를 고려하여 MRO가 결정된다. 

  - diamond.py
{% highlight python %}
class A:
    def ping(self):
        print('ping:', self)

class B(A):
    def pong(self):
        print('pong:', self)

class C(A):
    def pong(self):
        print('PONG:', self)

class D(B, C):
    def ping(self):
        super().ping() # Super클래스의 ping을 사용한다.
        print('post-ping:', self)
    def pingpong(self):
        self.ping()
        super().ping() # Python 2에서는 super(D, self).ping()을 사용한다.
        self.pong()
        super().pong()
        C.pong(self)
{% endhighlight %}

- D클래스의 의 __mro__ 
  - D, B, C, A 순서로 결정된다.

{% highlight python %}
>>> D.__mro__
(<class 'diamond.D'>, <class 'diamond.B'>, <class 'diamond.C'>,
<class 'diamond.A'>, <class 'object'>)
{% endhighlight %}

- pong을 호출하는 두가지 방법 

{% highlight python %}
>>> from diamond import *
>>> d = D()
>>> d.pong() # 그냥 호출하면 순서(__mro__)에 따라 클래스 B의 pong이 호출된다.
pong: <diamond.D object at 0x10066c278>
>>> C.pong(d) # C클래스를 명시하고 d 객체를 넘겨주면 C클래스의 pong이 호출된다.
PONG: <diamond.D object at 0x10066c278>
{% endhighlight %}

- super 클래스의 메서드를 호출하는 방법 
  - Python 2
    - super(CLASSNAME, self).METHODNAME()

  - Python 3
    - super().METHODNAME() : __mro__를 따른다.
    - CLASSNAME.METHODNAME(self) : __mro__를 무시한다.

  -  CLASSNAME.METHODNAME(self)
    - 바인딩되지 않은 메서드를 호출므로 self를 넘겨주어야 한다.
    - __mro__를 무시하므로 super()를 사용하는 방법이 더 안전하다.

- 클래스에 접근하여 호출하는 예 

{% highlight python %}
def ping(self):
    A.ping(self) # instead of super().ping()
    print('post-ping:', self)
{% endhighlight %}

- super()가 MRO를 따름을 보인다.  

{% highlight python %}
>>> from diamond import D
>>> d = D()
>>> d.ping() #
ping: <diamond.D object at 0x10cc40630> # A 클래스의 ping()이 호출되었다.
post-ping: <diamond.D object at 0x10cc40630> 

{% endhighlight %}


- pingpong()을 호출했을때 일어나는 일들


{% highlight python %}
>>> from diamond import D
>>> d = D()
>>> d.pingpong()
>>> d.pingpong()
ping: <diamond.D object at 0x10bf235c0> # D객체의 ping을 호출한다.
post-ping: <diamond.D object at 0x10bf235c0>
ping: <diamond.D object at 0x10bf235c0> # A객체의 ping을 호출한다.
pong: <diamond.D object at 0x10bf235c0> # __mro__에 따라 B.pong()을 호출한다.
pong: <diamond.D object at 0x10bf235c0> # __mro__에 따라 B.pong()을 호출한다.
PONG: <diamond.D object at 0x10bf235c0> # __mro__를 무시하고 C.pong()을 호출한다.
{% endhighlight %}

- MRO를 출력하는 예

{% highlight python %}
>>> bool.__mro__
(<class 'bool'>, <class 'int'>, <class 'object'>)
>>> def print_mro(cls):
...    print(', '.join(c.__name__ for c in cls.__mro__))
...
>>> print_mro(bool)
bool, int, object
>>> from frenchdeck2 import FrenchDeck2
>>> print_mro(FrenchDeck2)
FrenchDeck2, MutableSequence, Sequence, Sized, Iterable, Container, object
>>> import numbers
>>> print_mro(numbers.Integral)
Integral, Rational, Real, Complex, Number, object
>>> import io
>>> print_mro(io.BytesIO)
BytesIO, _BufferedIOBase, _IOBase, object
>>> print_mro(io.TextIOWrapper)
TextIOWrapper, _TextIOBase, _IOBase, object
{% endhighlight %}


## 실세계에서의 다중 상속

- Note: tkinter그래프는 넘어감

## 다중 상속 다루기

- **인터페이스 상속과 구현 상속을 구분한다.**
  - 인터페이스 상속은 'is-a'관계를 나타내는 서브타입을 생성한다.
  - 구현 상속은 코드 중복을 피한다.

- **ABC를 이용해서 인터페이스를 명확히 한다.**

- **코드를 재사용하기 위해 믹스인을 사용한다.**
  - js등 기타 언어처럼 Mixin을 위한 키워드를 제공하지 않는다.
  - __mro__를 이용해 Mixin개념을 고려하면서 구현해야한다.
  - Mixin클래스
    - 메소드만 있는클래스를 다른 클래스들과 함께 상속받아 새로운 클래스를 만들어 사용하는 방식
    - Mixin클래스에는 새로운 자료형을 정의하지 않는다. 
    - Mixin클래스는 객체를 생성하여 사용하지 않는다.
    - 재사용할 메서드만 묶어놓는다.

- **이름을 통해 믹스인임을 명확히 한다.**
  - 믹스인 postfix를 붙여라
  - 공식적으로 파이썬에서 믹스인키워드를 제공하지 않아서


- **ABC가 믹스인이 될 수는 있지만, 믹스인이라고 해서 ABC인 것은 아니다.**
  - ABC는 자료형을 정의하지만 믹스인은 정의하지 않는다.
  - ABC는 다른 클래스의 유일한 클래스가 될 수 있지만 믹스인은 하나만 상속받아 사용하면 안된다.

- **두 개 이상의 구상 클래스에서 상속받지 않는다.**
  - 0~1개의 구상클래스를 갖도록 한다.
  - 나머지 클래스는 ABC나 믹스인이어야 한다.

{% highlight python %}
class MyConcreteClass(Alpha, Beta, Gamma): # Beta, Gamma는 ABC나 믹스인이어야 한다.
    """This is a concrete class: it can be instantiated."""
# ... more code ...
{% endhighlight %}

- **사용자에게 집합 클래스를 제공한다.**
  - 클래스 여러개 모아서 사용자에게 제공하는 형태
  - 필요한 클래스만 모아서 기능을 제공하는 클래스이다. 
  - 집합 클래스에는 독립적인 구현 내용이 없다.

- **클래스 상속보다 객체 구성을 사용하라.**
  - 필드로 상속하려했던 객체를 정의한다.
  - 정의한 객체를 메서드에서 사용한다.


### Tkinter: 장점, 단점, 그리고 보기 흉함
- Tkinter는 위 내용의 거의 따르지 않음

## 최신 사례: 장고 제너릭 뷰의 믹스인
- 봐야됨^_^v
