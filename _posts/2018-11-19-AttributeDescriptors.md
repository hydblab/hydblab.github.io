---
layout: post
title: "Attribute descrptors"
author: "badhorror"
---
# Attribute descrptors

- Descripotrs는 같은 로직에 다양한 attribute를 엑세스하는방법이다
    - properties 외에도 디스크립터를 활용하는 기능은 classmethod 와 staticmethod 데코레이터다
- 디스크립터를 이해하는것이 이장의 핵심내용

## Descriptor example: attribute validation

- 이전장 Coding a property factory 처럼 함수 프로그래밍 패턴을 적용하여 겟터 및 셋트러르 반복적으로 코딩하지 않아야한다.
- 객체 지향적인 방법으로 같은 문제를 해결하는 방법은 디스크립터 클래스이다

## LineItem take 3: a simple descriptor

- get,set, delete 를 구현하는 클래스는 설명자이다
- 해당 인스턴스를 다른 클래스의 클래스 attribute로 선언함으로써 디스크립터를 사용한다
- Quantity 디스크립터를 만들고 LineItem 클래스는 Quantity의 두개 인스턴스를 사용한다: weight, price 관리


```python
# 설명자 프로토콜 기반으로 구현하기위해 하위 클래스가 필요하지 않음
class Quantity:
    def __init__(self, storage_name):
        #각 Quantity 인스턴스에는 storage_name attribute가 있음(관리되는 인스턴스 값을 보유할 속성이름)
        self.storage_name = storage_name
    #set은 attribute 관리 할당시 호출(self: 디스크립터 인스턴스(liineitem.weight, lineitem.price) instance:lineitem 인스턴스, value: 할당되는값)
    def __set__(self, instance, value):
        if value > 0:
            #관리되는 인스턴스의 dict를 직접 처리해야한다, 내장된 setAttr을 사용시 다시 set메서드가 트리거되어 무한재귀가 발생
            instance.__dict__[self.storage_name] = value
        else:
            raise ValueError('value must be > 0')
class LineItem:
    # 첫 디스크립터 인스턴스 weight에 바인딩,
    weight = Quantity('weight')
    price = Quantity('price')
    # 클래스 본체는 깨끗함
    def __init__(self, description, weight, price):
        self.description = description
        self.weight = weight
        self.price = price
    def subtotal(self):
        return self.weight * self.price

```


```python
truffle = LineItem('White truffle', 100,10)
truffle = LineItem('White truffle', 100,0)
```


    ---------------------------------------------------------------------------

    ValueError                                Traceback (most recent call last)

    <ipython-input-3-94f004f35667> in <module>()
          1 truffle = LineItem('White truffle', 100,10)
    ----> 2 truffle = LineItem('White truffle', 100,0)


    <ipython-input-2-08688de569d3> in __init__(self, description, weight, price)
         19         self.description = description
         20         self.weight = weight
    ---> 21         self.price = price
         22     def subtotal(self):
         23         return self.weight * self.price


    <ipython-input-2-08688de569d3> in __set__(self, instance, value)
         10             instance.__dict__[self.storage_name] = value
         11         else:
    ---> 12             raise ValueError('value must be > 0')
         13 class LineItem:
         14     # 첫 디스크립터 인스턴스 weight에 바인딩,


    ValueError: value must be > 0


- 디스크립터 인스턴스 자체에 각 관리 속성의 값을 저장하는것은 바람직하지 않다. set 메소드는 instacnce.__dict__[self.storage_name] = value 와 같다
    - 유혹적이지만 나쁜 대안은 다음과 같이 self.__dict__[self.storage_name] = value 이다
- 이것이 잘못된 이유를 이해할려면 __set__ 에 처음 두인수 의미를 생각해보면 된다. self는 실제로 관리 클래스의 클래스 속성인 디스크립터 인스턴스이다. 한번에 수천개의 LineItem인스턴스가 메모리에 있을수 있지만 설명자 인스턴스는 LineItem.weight, price 두가지이다 따라서 설명자 인스턴스 자체에 저장하는것은 실제로 lineItem 클래스 속성의 일부이므로 모든 LineItem 인스턴스에서 공유된다
- 위 예제에 단점은 디스크립터 클래스가 관리되는 클래스 본문에서 인스턴스화 될때 속성의 이름을 반복해야하는것이다. LineItem 클래스가 다음과 같이 선언될수있다면 더좋을것이다
    ```py
    class LineItem:
        weight = Quantity()
        price = Quantity()
    ```
- 문제는 8장에서 보았듯이 할당의 오른쪽이 변수가 존재하기 전에 실행된다는 것이다. Quantity()는 디스크립터 인스턴스를 생성하기 위해 실행되며, 현재 Quantity 클래스의 코드가 디스크립터가 바인딩될 변수의 이름을 추측할수있는 방법이 없다.
- 위 예제는 각 Quantity에 명시적으로 이름을 지정해야한다. 불편하고 위험할뿐만 아니라 프로그래머가 코드를 복사하여 붙여 넣을때 실수한다면 프로그램이 잘못 처리된다.
- 반복적인 이름 문제에 대해 실행가능한 솔루션이 다음에 제시되며 클래스 데코레이터나 메타 클래스가 필요한 방법은 21장에서 설명한다.

## LineItem take #4: automatic storage attribute names

- 설명자 선언에서 속성이름을 다시 입력하지 않을려면 각 Quantity 인스턴스의 strage_name에 대해 고유 문자열을 생성한다.
- storage_name 을 생성하기 위해 \_Quantity# 접두어로 시작하고 정수를 연결한다.
    - 새로운 Quantity 디스크립터 인스턴스가 클래스에 추가 될 떄마다 증가시킬 Quantity.\_\_counter 속성
-


```python
class Quantity:
    # 카운터는 Quantity 인스턴스의 수를 세는 클래스 속성
    __counter = 0
def __init__(self):
    # cls는 Quantity 클래스에 대한 참조
    cls = self.__class__
    prefix = cls.__name__
    index = cls.__counter
    # 각 디스크립터 인스턴스의 storage_name은 디스크립터 클래스 이름과 현재 카운터 값
    self.storage_name = '_{}#{}'.format(prefix, index)
    # 카운터 증가
    cls.__counter += 1
# 관리 속성의 이름이 storage_name과 같지 않기 떄문에 get을 구현. 소유자 인수는 곧 설명될것
def __get__(self, instance, owner):
    #getattr 내장 함수를 사용하여 인스턴스에서 값을 겁색
    return getattr(instance, self.storage_name)
def __set__(self, instance, value):
    if value > 0:
        # 내장된 setattr을 사용하여 인스턴스에 값을 저장
        setattr(instance, self.storage_name, value)
    else:
        raise ValueError('value must be > 0')

class LineItem:
    #관리 속성 이름을 Quantity 생성자에 전달할 필요가 없다. 이것이 이번 버전의 목표이다
    weight = Quantity()
    price = Quantity()

    def __init__(self, description, weight, price):
        self.description = description
        self.weight = weight
        self.price = price
    def subtotal(self):
        return self.weight * self.price

```

- 더높은 레벨의 getattr 과 setattr 내장 함수를 사용하여 인스턴스에 의지 하지 않고 값을 저장할수있다
- \_\_dict__ 관리 속성과 디스크립터 저장 속성의 이름이 다르므로 저장소 속성에서 getattr을 호출해도 디스크립터가 트리거되지 않으므로 무한 재귀를 회피 가능하다
- 테스트하면 weight 와 price가 예상대로 작동하고 스토리지 속성을 직접 읽을수있어 디버깅에 유용하다


```python

from bulkfood_v4 import LineItem
coconuts = LineItem('Brazilian coconut', 20, 17.95)
coconuts.weight, coconuts.price(20, 17.95)
```


    ---------------------------------------------------------------------------

    ImportError                               Traceback (most recent call last)

    <ipython-input-5-aee72710daca> in <module>()
          1
    ----> 2 from bulkfood_v4 import LineItem
          3 coconuts = LineItem('Brazilian coconut', 20, 17.95)
          4 coconuts.weight, coconuts.price(20, 17.95)


    ImportError: No module named 'bulkfood_v4'


- get은 3개 인수를 받는다. 자기, 인스턴스, 소유자
- owner 아규먼트는 관리되는 클래스(LineItem)에 대한 참조이며 설명자를 사용하여 클래스에서 속성을 가져오는 경우 편리하다
- weight와 같은 관리 속성이 LineItem.weight와 같은 클래스를 통해 검색되면 설명자 get 메소드는 인스턴스 인수의 값으로 none을 받는다.
- 반대로 사용자에 의한 내성 검사 및 다른 메타프로그래밍 트릭을 지원하려면 클래스를 통해 관리 속성에 엑세스 할때 get이 설명자 인스턴스를 반환하도록 하는것이 좋다


```python
class Quantity:
    __counter = 0
    def __init__(self):
        cls = self.__class__
        prefix = cls.__name__
        index = cls.__counter
        self.storage_name = '_{}#{}'.format(prefix, index)
        cls.__counter += 1
    def __get__(self, instance, owner):
        if instance is None:
            # 만약 호출이 인스턴스를 통과화지 않으면 디스크립터 자체를 반환
            return self
        else:
            # 평소와 같이 관리 속성값 반환
            return getattr(instance, self.storage_name)
    def __set__(self, instance, value):
        if value > 0:
            setattr(instance, self.storage_name, value)
        else:
            raise ValueError('value must be > 0')
```

- 위 예를 보면 두가지 속성을 관리하기 위한 많은 코드가 있다고 생각되지만 디스크립터 논리가 별도의 코드 단위 인 Quantity 클래스로 추상화된다는 사실이 중요하다
- 디스크립터가 사용되는 동일한 모듈에서 디스크립터를 정의하지 않고 프레임 웤을 개발할 경우 많은 애플리케이션에서 조차도 애플리케이션 전반에 걸쳐 사용되도록 설계된 별도의 유틸리티 모듈에 정의한다


```python
import model_v4c as model

class LineItem:
    weight = model.Quantity()
    price = model.Quantity()

    def __init__(self, description, weight, price):
        self.description = description
        self.weight = weight
        self.price = price

    def subtotal(self):
        return self.weight * self.price
```


    ---------------------------------------------------------------------------

    ImportError                               Traceback (most recent call last)

    <ipython-input-7-9bbb31cff1c2> in <module>()
    ----> 1 import model_v4c as model
          2
          3 class LineItem:
          4     weight = model.Quantity()
          5     price = model.Quantity()


    ImportError: No module named 'model_v4c'


- Django 사용자는 위 예가 모델정의와 매우 흡사하다는것을 알게된다. 이는 우연의 일치가 아니고 Django 모델 필드는 디스크립터이다

## LineItem take #5: a new descriptor type
