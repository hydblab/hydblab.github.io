---
layout: post
title: "클래스 메타프로그래밍"
author: "Alghost"
--- 

## 이 장에 들어가기에 앞서

- 메타클래스는 99%의 사용자가 신경 써야 하는 것보다 훨씬 더 깊이 있는 마술이다.
- 필요한 것일까 하는 의문이 든다면, 여러분에게 메타클래스는 필요 없다.
- 실제로 메타클래스가 필요한 사람은 자신에게 메타클래스가 필요하다는 것을 명확히 알고 있으며, 이유를 설명할 필요가 없다.
- 프레임워크를 만들고 있지 않다면, 메타클래스를 작성해서는 안 된다. 그냥 재미로 하거나, 배운 개념을 적용해보기 위한 것이 아니라면.

## 클래스 팩토리

- collections.namedtuple()이라는 클래스 팩토리가 있다.
- 이 함수를 사용하면 클래스명과 속성명을 가져올 수 있게 해주고, \_\_repr\_\_()메서드를 제공하는 tuple의 서브클래스를 생성한다.
- 개에 대한 데이터를 간단한 레코드로 처리하고 싶다고 가정할 때 아래와 같은 식상한 코드는 좋지 않다.
{% highlight python %}
class Dog:
    def __init__(self, name, weight, owner):
        self.naem = naem
        self.weight = weight
        self.owner = owner
{% endhighlight %}
- 이러한 코드는 repr()로 출력한 내용도 마음에 들지 않는다.
{% highlight python %}
>>> rex = Dog('Rex', 30, 'Bob')
>>> rex
<__main__.Dog object at 0x127839>
{% endhighlight %}
- collections.namedtuple()에서 힌트를 얻어 record_factory()를 만들어보자.
{% highlight python %}
>>> Dog = record_factory('Dog', 'name weight owner')
>>> rex = dog('Rex', 30, 'Bob')
>>> rex
Dog(name='Rex', weight=30, owner='Bob')
>>> name, weight, _ = rex
>>> name, weight
('Rex', 30)
{% endhighlight %}
- 아래는 record_factory() 함수의 코드다.
{% highlight python %}
def record_factory(cls_name, field_names):
    try:
        field_names = field_names.replace(',', ' ').split()
    except AttributeError:
        pass
    field_names = tuple(field_names)

    def __init__(self, *args, **kwargs):
        attrs = dict(zip(self.__slots__, args))
        attrs.update(kwargs)
        for name, value in attrs.items():
            setattr(self, name, value)

    def __iter__(self):
        for name in self.__slots__:
            yield getattr(self, name)
    
    def __repr__(self):
        values = ', '.join('{}={!r}'.format(*i) for i in zip(self.__slots__, self))
        return '{}({})'.format(self.__class__.__name__, values)
    
    cls_attrs = dict(__slots__ = field_names,
                     __init__ = __init__,
                     __iter__ = __iter__,
                     __repre__ = __repre__)
    return type(cls_name, (object,), cls_attrs)
{% endhighlight %}
- type()을 일종의 함수로 생각하기 쉽지만, 인수 세 개를 받아서 호출하면 새로운 클래스를 생성하는 일종의 클래스처럼 작동한다.
- 아래 두 코드는 기능상으로 동일하다.
{% highlight python %}
MyClass = type('MyClass', (MySuperClass, MyMixin), {'x':43, 'x2': lambda self: self.x * 2})
{% endhighlight %}
{% highlight python %}
class MyClass(MySuperClass, MyMixin):
    x = 42
    def x2(self):
        return self.x * 2
{% endhighlight %}
- 여기서 중요한(특이한) 점은 type의 객체가 클래스라는 것이다. 
- record_factory()로 생성한 클래스의 객체들은 직렬화할 수 없다는 제한이 있다.
- 즉, pickle 모듈의 dump(), load() 함수와 함께 사용할 수 없다.

## 디스크립터를 커스터마이즈하기 위한 클래스 데커레이터

- 20장에서 다루는 디스크립터를 커스터마이즈할 수 있음

{% highlight python %}
>>> LineItem.weight.storage_name
'_Quantity#0'
{% endhighlight %}
- 위처럼 표시되는 디스크립터가 아래와 같이 속성의 이름을 포함하고 있으면 더 좋을 것이다.
{% highlight python %}
>>> LineItem.weight.storage_name
'_Quantity#weight'
{% endhighlight %}
- 디스크립터 객체가 생성될 때는 관리 대상 속성의 이름을 알 수 없기 때문에 사용할 수 없었다.
- 하지만 클래스가 만들어지고 디스크립터 객체가 클래스 속성에 바인딩된 후에는 클래스를 조사하고 디스크립에 저장소명을 설정할 수 있다.
- 이를 위해 클래스 데커레이터를 사용하는데, 함수 데커레이터와 아주 비슷하다.
- 클래스를 받아서 동일하거나 수정된 클래스를 반환한다.

{% highlight python %}
import model_v6 as model

@model.entity
class LineItem:
    description = model.NonBlank()
    weigth = model.Quantity()
    price = model.Quantity()

    def __init__(self, description, weight, price):
        self.description = description
        self.weight = weight
        self.price = price

    def subtotal(self):
        return self.weight * self.price
{% endhighlight %}

{% highlight python %}
def entity(cls):
    for key, attr in cls.__dict__.items():
        if isinstance(attr, Validated):
            type_name = type(attr).__name__
            attr.storage_name = '_{}#{}'.format(type_name, key)
    return cls
{% endhighlight %}

## 임포트 타임과 런타임

- 임포트 타임에 인터프리터는 .py 모듈에 들어 있는 소스코드를 위에서부터 한 번 파싱하고, 바이트코드를 생성한다.
- 구문에러가 있으면 이때 발생한다.
- import 문은 단지 단순한 선언이 아니며, 임포트되는 모듈의 모든 최상위 수준 코드를 실제로 실행한다.
- 즉, import 문이 각종 '런타임'의 동작을 유발하기 때문에 '임포트 타임'과 '런타임'의 구분이 모호해진다.
- 임포트 타임에 함수의 선언인 def문은 실행하지만 본체는 런타임에 실행된다.
- 하지만 클래스는 클래스의 본체를 실행한다.

### 코드 평가 시점 연습문제

- 코드 내용은 생략
- 시나리오 #1 유의할점: 클래스 본체를 전부 실행하는데, 데커레이터가 지정되어 있으면 해당 클래스 본체 실행후 데커레이터도 실행된다.
- 시나리오 #2 유의할점: 데커레이터가 지정된 클래스를 상속받더라도, 데커레이터가 지정되어있지 않은 클래스는 영향받지 않음

## 메타클래스 기본 지식

- 메타클래스는 일종의 클래스 팩토리다. 다만 record_factory()와 같은 함수 대신 클래스로 만들어진다는 점이다.
- 클래스도 객체이므로, 각 클래스는 다른 어떤 클래스의 객체여야 한다.
- 기본적으로 파이썬 클래스는 type의 객체다.

```
>>> 'spam'.__class__
<class 'str'>
>>> str.__class__
<class 'type'>
>>> from bulkfood_v6 import LineItem
>>> LineItem.__class__
<class 'type'>
>>> type.__class__
<class 'type'>
```

- 무한 회귀를 방지하기 위해, 마지막 행에서 보는 것처럼 type은 자기 자신의 객체로 정의되어 있다.
- str이나 LineItem이 type을 상속한다는 것이 아니라, str과 LineItem 클래스가 모두 type의 객체라는 점을 강조하고 싶다.
- 표준 라이브러리에는 type 외에도 ABCMeta, Enum 등의 메타클래스도 있다.

```
>>> import collections
>>> collections.Iterable.__class__
<class 'abc.ABCMeta'>
>>> import abc
>>> abc.ABCMeta.__class__
<class 'type'>
>>> abc.ABCMeta.__mro__
(<class 'abc.ABCMeta'>, <class 'type'>, <class 'object'>)
```

- 모든 클래스는 직간접적으로 type의 객체지만, 메타클래스만 type의 서브클래스다.
- ABCMeta등의 메타클래스는 type으로부터 클래스 생성 능력을 상속한다.

### 메타클래스 평가 시점 연습문제

{% highlight python %}
...

class ClassFive(metaclass=MetaAleph):
    print('<[6]> ClassFive body')

    def __init__(self):
        print('<[7]> ClassFive.__init__')
...
class ClassSix(ClassFive):
    print('<[6]> ClassSix body')

    def __init__(self):
        print('<[7]> ClassFive.__init__')

...
{% endhighlight %} 

```
>>> import evaltime_meta
...
<[6]> ClassFive body
<[500]> MetaAleph.__init__
<[7]> ClassSix body
<[500]> MetaAleph.__init__
...
```

- ClassFive를 초기화하기 위해 MetaAleph.\_\_init\_\_이 실행된다는 점이 다르다.
- ClassFive의 서브클래스인 ClassSix도 초기화한다.

```
>>> python3 evaltime_meta.py
...
<[7]> ClassFive.__init__
<[600]> MetaAleph.__init__:inner_2
<[7]> ClassSix.__init__
<[600]> MetaAleph.__init__:inner_2
...
```
- 임포트 타임에 실행될때와 달리 런타임에 \_\_init\_\_()이 실행되면서 inner_2로 변경된다.
- 그리고 ClassFive를 상속하고 잇는 ClassSix도 MetaAleph의 객체가 되기 때문에 inner_2로 변경된다.

## 디스크립터를 커스터마이즈하기 위한 메타클래스

{% highlight python %}
class EntityMeta(type):
    """검증된 필드를 가진 비즈니스 개체에 대한 메타클래스"""

    def __init__(cls, name, bases, attr_dict):
        super().__init__(name, bases, attr_dict) # type의 init을 호출
        for key, attr in attr_dict.items():
            if isinstance(attr, Validated):
                type_name = type(attr).__name__
                attr.storage_name = '_{}#{}'.format(type_name, key)

class Entity(metaclass=EntityMeta):
    """검증된 필드를 가진 비즈니스 개체"""

class LineItem(model.Entity):
    ...
{% endhighlight %} 

- 메타클래스가 받쳐주기 때문에 Entity만 상속받으면 된다.

## 메타클래스 \_\_prepare\_\_() 특별 메서드

- 몇몇 APP에서는 클래스의 속성이 정의되는 순서를 알아야 하는 경우가 종종 있다.
- CSV 파일을 읽고 쓰는 라이브러리의 경우 CSV 파일에서 열의 순서대로 클래스 안에 필드를 매핑해야하는 경우도 있다.
- 기본적으로 매핑은 딕셔너리형이므로 속성의 순서가 사라진다.
- \_\_prepare\_\_()는 메타클래스에서만 의미가 있고, 클래스 메서드여야 한다.
- \_\_new\_\_()를 호출하기 전에 클래스 본체의 속성을 이용해서 채울 매핑을 생성하기 위해 \_\_prepare\_\_()를 호출한다.
- \_\_prepare\_\_()에서 OrderedDict()를 반환하여 순서를 보장할 수 있다.

{% highlight python %}
class EntityMeta(type):
    """검증된 필드를 가진 비즈니스 개체에 대한 메타클래스"""

    @classmethod
    def __prepare__(cls, name, bases):
        return collections.OrderedDict()

    def __init__(cls, name, bases, attr_dict):
        super().__init__(name, bases, attr_dict) # type의 init을 호출
        cls._field_names = []
        for key, attr in attr_dict.items():
            if isinstance(attr, Validated):
                type_name = type(attr).__name__
                attr.storage_name = '_{}#{}'.format(type_name, key)
                cls._field_names.append(key)

class Entity(metaclass=EntityMeta):
    """검증된 필드를 가진 비즈니스 개체"""

    @classmethod
    def field_names(cls):
        for name in cls._field_names:
            yield name

class LineItem(model.Entity):
    ...
{% endhighlight %} 

## 마무리

* 프레임워크와 라이브러리에서 다음과 같은 작업을 위해 사용된다
    * 속성 검증
    * 많은 메서드에 데커레이터를 일괄 적용
    * 객체 직렬화 및 데이터 변환
    * 객체 관계 매핑
    * 객체 기반 영속성
    * 다른 언어에서 만든 클래스 구조체를 파이썬 클래스로 동적 변환

