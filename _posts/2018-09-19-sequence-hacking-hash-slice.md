---
layout: post
title: "시퀀스 해킹, 해시, 슬라이스"
author: "Alghost"
--- 

## 이 장에서 제공할 기능

- 기본 시퀀스 프로토콜: \_\_len\_\_()과 \_\_getitem\_\_() 메서드
- 여러 항목을 가진 객체를 안전하게 표현
- 슬라이싱을 지원해서 새로운 벡터 객체 생성
- 포함된 요소 값을 모두 고려한 집합 해싱
- 커스터마이즈된 포맷 언어 확장

## Vector 버전 #1: Vector2d 호환

- \_\_init\_\_() 메서드에서 임의의 인수 *args를 받아서 Vector(3, 4), Vector(3, 4, 5) 형태로 만들 수도 있지만 다른 내장 시퀀스처럼 반복형을 인수로 받게 만드는 것이 좋다.
{% highlight python %}
>>> Vector([3.1, 4.2])
Vector([3.1, 4.2])
>>> Vector((3, 4, 5))
Vector([3, 4, 5])
>>> Vector(range(10))
Vector([0.0, 1.0, 2.0, 3.0, 4.0, ...])
{% endhighlight %}

- 요소가 6개 이상일 때는 생략 기호(...)로 축약되는데, 이는 repr() 메서드에서 reprlib모듈을 호출하기 때문이다.
{% highlight python %}
import reprlib

class Vector:
    typecode = 'd'
    # ... 중략 ...
     
    def __repr__(self):
        components = reprlib.repr(self._components)
        components = components[components.find('['):-1]
        return 'Vector({})'.format(components)

    # ... 중략 ...
{% endhighlight %}
- 기존 출력인 Vector(array('d', [3.0, 4.0, 5.0]))이 아니라 Vector([3.0, 4.0, 5.0])으로 출력된다.
- reprlib.repr(list(self._components))를 사용하지 않은 이유는 list() 메서드에 의해 값을 복사하는 것은 낭비이기 때문이다.
- 따라서 문자열을 자르는 방법을 사용했다.

## 프로토콜과 덕 타이핑

- 프로토콜: 문서에만 정의되어 있고 실제 코드에서는 정의되지 않는 비공식 인터페이스
- 시퀀스 프로토콜은 \_\_len\_\_()과 \_\_getitem\_\_()메서드를 동반할 뿐이다.
- 즉 \_\_len\_\_()와 \_\_getitem\_\_() 메서드를 구현하면 시퀀스라는 이다.
- 이러한 메커니즘을 __덕 타이핑__이라고 부른다.
- 하지만 프로토콜은 비공식적이고 강제하는 사항이 아니기 때문에 일부만 구현해도 문제 없다.

## Vector 버전 #2: 슬라이스 가능한 시퀀스

{% highlight python %}
class Vector:
    typecode = 'd'
    # ... 중략 ...
     
    def __len__(self):
        return len(self._components)

    def __getitem__(self, index):
    return self._components[index]

    # ... 중략 ...
{% endhighlight %}

- 두 메서드가 추가되었으니, 시퀀스처럼 아래 연산이 가능하다.
{% highlight python %}
>>> v1 = Vector([3, 4, 5])
>>> len(v1)
3
>>> v1[0], v1[-1]
(3.0, 5.0)
>>> v7 = Vector(range(7))
>>> v7[1:4]
array('d', [1.0, 2.0, 3.0])
{% endhighlight %}
- 슬라이싱도 지원되지만, 사실 제대로 지원하는 것은 아니다.
- Vector의 슬라이스도 배열이 아니라 Vector 객체가 되어야 한다.
- 따라서 \_\_getitem\_\_() 메서드를 다시 구현해야 한다.
- 다시 구현하기 전에 슬라이싱 작동 방식부터 확인해보자.

### 슬라이싱의 작동 방식
{% highlight python %}
>>> class MySeq:
...     def __getitem__(self, index):
...         return index
...
>>> s = MySeq()
>>> s[1]
1
>>> s[1:4]
slice(1, 4, None)
>>> s[1:4:2]
slice(1, 4, 2)
>>> s[1:4:2, 9]
(slice(1, 4, 2), 9) # [] 안에 콤마가 있으면 __getitem__()이 튜플을 받는다
>>> s[1:4:2, 7:9]
(slice(1, 4, 2), slice(7, 9, None)) # 여러 슬라이스 객체가 들어 있을 수도 있다
{% endhighlight %}
- slice 클래스에는 indices 라는 메서드가 있다.
- indices: '빠지거나 음수인 인덱스'와 '대상 시퀀스보다 긴 슬라이스'를 우아하게 처리해주는 함수
- S.indices(len) => (start, stop, stride) 로 반환
{% highlight python %}
>>> slice(None, 10, 2).indices(5) # 길이가 5인 slice라고 가정: a[:10:-2]
(0, 5, 2)
>>> slice(-3, None, None).indices(5) # 길이가 5인 slice라고 가정: a[-3:]
{% endhighlight %}
- 이 indices() 메서드는 기반 시퀀스가 제공하는 서비스에 의존할 수 없을 때 도움이 된다.

### 슬라이스를 인식하는 \_\_getitem\_\_()
{% highlight python %}
def __len__(self):
    return len(self._components)

def __getitem__(self, index):
    cls = type(self)
    if isinstance(index, slice):    # 슬라이스로 접근한 경우
        return cls(self._components[index])
    elif isinstance(index, numbers.Integral): # 인덱싱으로 접근한 경우
        return self._components[index]
    else:
        msg = '{cls.__name__} indices must be integers'
        raise TypeError(msg.format(cls=cls))
{% endhighlight %}
- 슬라이스로 접근한 경우와 인덱스로 접근한 경우 구분하여 슬라이스인 경우 cls를 통해 객체를 생성하고 아니라면 값을 반환한다.
- 파이썬스러운 객체를 만드려면 객체를 흉내내야 한다. 따라서 파이썬에서 제공하는 에러 메시지를 그대로 따라 작성한다.

{% highlight python %}
>>> v7 = Vector(range(7))
>>> v7[-1]
6.0
>>> v7[1:4]
Vector([1.0, 2.0, 3.0])
>>> v7[1,2]
Tracback (most recent call last):
  ...
TypeError: Vector indices must be integers
{% endhighlight %}

## Vector 버전 #3: 동적 속성 접근

- 실제 Vector 처럼 v.x, v.y 와 같이 이름으로 접근하면 편리할 것이다.
- @property 데커레이터를 이용해서 x, y에 읽기 전용 접근을 제공했지만 \_\_getattr\_\_() 메서드를 사용하면 더욱 깔끔하게 구현할 수 있다.
- 인터프리터는 my_obj.x 표현식이 주어지면, 속성이 있는지 검사하고 없으면 \_\_class\_\_에서 검색한다.
- 위 과정에서 못찾으면 속성명을 문자열로 전달해서(위 예에서는 'x') \_\_getattr\_\_() 메서드를 호출하여 검사한다.

{% highlight python %}
shortcut_names = 'xyzt'

def __getattr__(self, name):
    cls = type(self)
    if len(name) == 1:
        pos = cls.shortcut_names.find(name)
        if 0 <= pos < len(self._components):
            return self._components[pos]
    
    msg = '{.__name__!r} object has no attribute {!r}'
    raise AttributeError(msg.format(cls, name))
{% endhighlight %}
- 위와 같이 만들어서 사용하면 일단 동작에는 문제가 없지만 일관성이 없어진다.

{% highlight python %}
>>> v = Vector(range(5))
>>> v
Vector([0.0, 1.0, 2.0, 3.0, 4.0])
>>> v.x
0.0
>>> v.x = 10
>>> v.x
10
>>> v
Vector([0.0, 1.0, 2.0, 3.0, 4.0])
{% endhighlight %}
- v.x에서 값을 쓴 경우 실제 x라는 속성에 값을 할당되기 때문에 그 이후에는 \_\_getattr\_\_()을 호출하지 않는다.
- 따라서 \_\_setattr\_\_()메서드를 구현하여 해당 값을 생성하지 못하도록 막는다.

{% highlight python %}
def __setattr__(self, name, value):
    cls = type(self)
    if len(name) == 1:
        if name in cls.shortcut_names:
            error = 'readonly attribute {attr_name!r}'
        elif name.islower():
            error = "can't set attributes 'a' to 'z' in {cls_name!r}"
        else:
            error = ''
        if error:
            msg = error.format(cls_name=cls.__name__, attr_name=name)
            raise Attribute(msg)
    super().__setattr__(name, value)
{% endhighlight %}
- 읽기 전용 속성이라는 에러 메시지를 명확히 안내하고 값을 넣지 않는다.
- 이 예제는 단순히 소문자로 되어 있는 속성만 막고 있다.

## Vector 버전 #4: 해싱 및 더 빠른 ==

- \_\_hash\_\_()를 구현해볼건데, 모든 값에 대해 hash(v[0]) ^ hash(v[1]) ^ hash(v[2]) ... 형태로 해시값을 계산하려고 한다.
- 이처럼 누적 계산하는 방법으로는 reduce() 메서드가 있다.
- reduce(fn, lst)를 호출하면 fn(lst[0], lst[1])을 호출하여 결과 r1을 생성하고, fn(r1, lst[2])를 호출하여 반복한다.
- 아래는 reduce()메서드를 사용하여 XOR로 누적 계산하는 방법이다.

{% highlight python %}
>>> n = 0
>>> for i in range(6)
...     n ^= i
...
>>> n
1
>>> import functools
>>> functools.reduce(lambda a, b: a^b, range(6))
1
>>> import operator
>>> functools.reduce(operator.xor, range(6))    # 람다 사용을 줄일 수 있다.
{% endhighlight %}

- Vector클래스에 \_\_hash\_\_()메서드도 위와 같은 방법으로 구현한다.
{% highlight python %}
def __hash__(self):
    hashes = (hash(x) for x in self._components)
    return functools.reduce(operator.xor, hashes, 0)
{% endhighlight %}
- reduce()메서드를 사용할 때 마지막 인수인 0은 초기값으로, 시퀀스가 비어있을 때 반환되는 값이다.
- 여기서 제너레이터 표현식을 사용하고 있지만 map()메서드를 활용해서 가독성을 높힐 수 있다.
{% highlight python %}
def __hash__(self):
    hashes = map(hash, self._components)
    return functools.reduce(operator.xor, hashes, 0)
{% endhighlight %}
- 파이썬2에서는 map()메서드가 비효율적이지만 파이썬3에서는 제너레이터 표현식과 마찬가지로 효율이 좋다.

- \_\_eq\_\_()메서드도 빠르고 메모리를 적게 사용하도록 바꿔보자.
- 기존 구현
{% highlight python %}
def __eq__(self, other):
    return tuple(self) == tuple(other)
{% endhighlight %}
- 이 구현은 Vector([1, 2])와 (1, 2)가 같다고 판단하지만 이는 13장에서 다루니 무시한다.
- 이 코드는 전체 값을 복사하기 때문에 매우 비효율적이다.
- 여기서 zip() 메서드를 사용하면 훨씬 효율적이다.
{% highlight python %}
def __eq__(self, other):
    if len(self) != len(other):
        return False
    for a, b in zip(self, other):
        if a != b:
            return False
    return True
{% endhighlight %}
- zip() 함수는 두 값의 길이가 다를 때, 짧은 길이만큼 반복하고 끝나기 때문에 길이 __꼭 길이를 먼저 비교해야 한다__.
- all() 함수를 사용하여 한줄로 표현할 수도 있다.
{% highlight python %}
def __eq__(self, other):
    return len(self) == len(other) and all(a == b for a, b in zip(self, other))
{% endhighlight %}
- zip() 함수와 유사한 enumerate() 내장 함수도 인덱스 변수를 직접 조작할 필요 없이 제너레이터 함수다.
- enumerate() 함수는 시퀀스를 인수로 받아, 인덱스와 값을 언패킹하여 서용할 수 있도록 반환한다.
