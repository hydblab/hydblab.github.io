---
layout: post
title: "연산자 오버로딩: 제대로 하기"
author: "Alghost"
--- 

## 연산자 오버로딩 기본 지식

- 내장 자료형에 대한 연산자는 오버로딩할 수 없다
- 새로운 연산자를 생성할 수 없으며, 기존 연산자를 오버로딩만 할 수 있다
- is, and, or, not 연산자는 오버로딩할 수 없다(그러나 &, \|, ~ 비트 연산자는 가능하다)

## 단항 연산자

- -(\_\_neg\_\_): 단항 산술 부정. x가 -2면, -x는 2다.
- +(\_\_pos\_\_): 단항 산술 덧셈. 일반적으로 x와 +x는 동일하지만, 그렇지 않은 경우도 있다.
    - decimal.Decimal, collections.Counter 객체일 때 일부 있으나, 거의 항상 똑같다고 생각해도 무방하다.
- ~(\_\_invert\_\_): 정수형의 비트 반전. ~x는 -(x+1)로 정의된다(~x == -(x+1)). x가 2면, ~x는 -3이다.

- 아래는 Vector 객체의 -v와 +v를 지원하기 위해 추가한 내용
{% highlight python %}
def __neg__(self):
    return Vector(-x for x in self)

def __pos__(self):
    return Vector(self)
{% endhighlight %}

## + 오버로딩하기

{% highlight python %}
>>> v1 = Vector([3, 4, 5])
>>> v2 = Vector([6, 7, 8])
>>> v1 + v2
Vector([9.0, 11.0, 13.0])
>>> v1 + v2 = Vector([3+6, 4+7, 5+8])
{% endhighlight %}
- 위와 같이 동작한다
- 서로 크기가 다른 객체를 더한 경우, 여러 사례를 보면 짧은 쪽 벡터의 빈 공간을 0으로 채워서 더하는 것이 낫다
- 이를 구현해보면 아래와 같다
{% highlight python %}
def __add__(self, other):
    pairs = itertools.zip_longest(self, other, fillvalue=0.0)
    return Vector(a + b for a, b in pairs)
{% endhighlight %}
- a + b에서 a에 \_\_add\_\_()가 없다면 b의 \_\_radd\_\_()를 호출한다
- \_\_radd\_\_()는 역순 특별 메서드라고 부른다(필자 선호)
{% highlight python %}
def __radd__(self, other):
    return self + other
{% endhighlight %}
- 이는 혼합형 연산을 지원하기 위해 구현해야한다
{% highlight python %}
>>> v1 = Vector([3, 4, 5])
>>> (10, 20, 30) + v1
Error!
{% endhighlight %}
- \_\_radd\_\_()는 +연산자를 통해 \_\_add\_\_()를 호출한다
- 위처럼 개발하게 되면 자료형에 의존적이게 된다. 왜냐하면 itertools를 통해 iterable을 전제로 구현했기 때문이다.
- 따라서, 적절한 에러(NotImplemented)를 만들어서 반환해야 한다.
- NotImplemented를 반환하면 역순 메서드를 호출하여 문제가 발생하지 않을 수 있다.
{% highlight python %}
def __add__(self, other):
    try:
        pairs = itertools.zip_longest(self, other, fillvalue=0.0)
        return Vector(a + b for a, b in pairs)
    except TypeError:
        return NotImplemented
{% endhighlight %}

## * 오버로딩하기

{% highlight python %}
>>> v1 = Vector([1, 2, 3])
>>> v1 * 10
Vector([10.0, 20.0, 30.0])
>>> 11 * v1
Vector([11.0, 22.0, 33.0])
{% endhighlight %}
- 위처럼 지원하기 위해 \_\_mul\_\_()과 \_\_rmul\_\_()를 구현
{% highlight python %}
def __mul__(self, scalar):
    return Vector(n * scalar for n in self)

def __rmul__(self, scalar):
    return self * scalar
{% endhighlight %}
- + 오버로딩과 같이 올바른 예외를 발생시키기 위해 보완
{% highlight python %}
def __mul__(self, scalar):
    if isinstance(scalar, numbers.Real):
        return Vector(n * scalar for n in self)
    else:
        return NotImplemented
{% endhighlight %}

## 향상된 비교 연산자

- ==, !=, >, <, >=, <= 비교 연산자를 다루는 방법과 유사하지만 NotImplemented가 반환되면 역순 메서드를 실행한다
- 예를 들어 a > b일 때 a.\_\_gt\_\_(b)를 호출하고 NotImplemented가 반환되면 b.\_\_lt\_\_(b)를 호출한다
- 비교를 하는데, 아래와 같이 개발하면 문제가 발생할 수 있다. (타입에 따라)
{% highlight python %}
class Vector:
    def __eq__(self, other):
        return (len(self) == len(other) and
                all(a == b for a, b in zip(self, other)))
{% endhighlight %}
- 만약 Vector와 같은 값을 가진 튜플과 비교한다고 가정하면 참을 반환한다
- 아래와 같이 개선할 수 있다
{% highlight python %}
class Vector:
    def __eq__(self, other):
        if isinstance(other, Vector):
            return (len(self) == len(other) and
                    all(a == b for a, b in zip(self, other)))
        else:
            return NotImplemented
{% endhighlight %}
- \_\_ne\_\_()와 같이 구현한 비교 연산자의 역순 메서드의 경우 아래와 같이 편리하게 개발할 수 있다.
{% highlight python %}
class Vector:
    def __ne__(self, other):
        eq_result = self == other
        if eq_result is NotImplemented:
            return NotImplemented
        else:
            return not eq_result
{% endhighlight %}

## 복합 할당 연산자

- 복합 연산자인 a += b를 a = a + b로 평가하기 때문에, \_\_add\_\_()가 있으면 +=를 제공할 수 있다.
- 하지만 구분해서 구현하고자 하면 \_\_iadd\_\_()를 구현해한다.
- 구현시 유의사항으로는 두 함수의 반환 객체가 다르다는 점이다.
    - \_\_add\_\_(): AddableBingoCage()를 호출해서 생성된 객체를 반환한다.
    - \_\_iadd\_\_(): 객체 자신을 변경한 후 self를 반환한다.
{% highlight python %}
class AddableBingoCage(BingoCage):
    def __add__(self, other):
        if isinstance(other, Tombola):
            return AddableBingoCage(self.inspect() + other.inspect())
        else:
            return NotImplemented
    
    def __iadd__(self, other):
        if isinstance(other, Tombola):
            other_iterable = other.inspect()
        else:
            try:
                other_iterable = iter(other)
            except TypeError:
                self_cls = type(self).__name__
                msg = "right operand in += must be {!r} or an iterable"
                raise TypeError(msg.format(self_cls))
        self.load(other_iterable)
        return self
{% endhighlight %}
