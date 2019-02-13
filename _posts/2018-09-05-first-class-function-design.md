---
layout: post
title: "일급 함수 디자인 패턴"
author: "Alghost","Badhorror"
---

## 사례: 전략(Strategy) 패턴의 리팩토링

> function object를 사용하여 리펙토링하고 커맨드 패턴을 단순화

> Strategy 패턴은 파이썬이 first class object를 사용하여 더 단순화되는 좋은 예다.

### 고전적인 패턴

- Order(콘텍스트), Promotion(전략), FidelityPromo(구체적인 전략1), BulkItemPromo(구체적인 전략2) 등 으로 구성되는 패턴
- 전자상거래 예
    - Context : 계산 알고리즘을 서비스를 제공.(여러 알고리즘 중 프로모션 할인을 적용하도록 구성)
    - Strategy : 공통적인 인터페이스. (프로모션이라는 추상클래스)
    - Concrete Strategy : 전략의 구체적인 하위 클래스 중 하나.(프로모션 추상클래스를 받아서 구현된 알고리즘)

#### 콘텍스트
- 일부 계산을 서로 다른 알고리즘을 구현하는 교환 가능한 컴포넌트에 위임함으로써 서비스를 제공한다. 예를 들어 '주문'이라는 서비스에서 '프로모션'이라는 계산을 사용

#### 전략
- 여러 알고리즘을 구현하는 컴포넌트에 공통된 인터페이스

#### 구체적인 전략
- 전략의 구상 서브클래스 중 하나

#### ABC와 abstractmethod를 활용한 추상 클래스 방법
{% highlight python %}
from abc import ABC, abstractmethod

class Promotion(ABC):

    @abstractmethod
    def discount(self, order):
        """할인액을 구체적인 숫자로 반환한다."""

class BulkItemPromo(Promotion):
    def discount(self, order):
        """구체적인 전략"""
{% endhighlight %}

### 함수지향 전략

- 위 처럼 추상클래스를 사용하지 않고 함수를 구체적인 전략을 함수로 생성하여 활용 할 수 있음
{% highlight python %}
class Order:

    def due(self):
        if self.promotion is None:
            discount = 0
        else:
            discount = self.promotion(self)
        return self.total() - discount

def fidelity_promo(order):
    return order.total() * .05 if order.customer.fidelity >= 1000 else 0


joe = Customer('John Doe', 0)
banana_cart = [LineItem('banana', 4, .5)]
Order(joe, banana_cart, fidelity_promo) # fidelity_promo 적용
{% endhighlight %}

- 전략 패턴을 함수로 구현했기 때문에 문제가 생길 수 있음
- 예를 들어 Order 객체에 대해 가장 좋은 할인 전략을 선택하는 '메타 전략'을 만든다고 가정했을 때 문제가 됨

### 최선의 전략 선택하기: 단순한 접근법

{% highlight python %}
def fidelity_promo(order):
    return order.total() * .05 if order.customer.fidelity >= 1000 else 0

def bulk_promo(order):
    return order.total() * .05 if order.customer.fidelity >= 1000 else 0

promos = [fidelity_promo, bulk_item_promo] # 함수들의 리스트

def best_promo(order):
    return max(promo(order) for promo in promos)
joe = Customer('John Doe', 0)
banana_cart = [LineItem('banana', 4, .5)]
Order(joe, banana_cart, best_promo) # best_promo 적용
{% endhighlight %}

- 가독성도 좋고 제대로 작동하지만, 새로운 할인 전략을 추가하려면 함수를 코딩하고 이 함수를 promos 리스트에 추가해야함

### 모듈에서 전략 찾기

> globals()
> 현재 전역 심벌 테이블을 나타내는 딕셔너리 객체를 반환. 현재 모듈에 대한 내용을 담고 있다.
> 함수를 호출한 모듈이 아니라 함수가 정의된 모듈을 나타낸다.

{% highlight python %}
promos = [globals()[name] for name in globals()
             if name.endswith('_promo')
             and name != 'best_promo']

def best_promo(order):
    return max(promo(order) for promo in promos)
{% endhighlight %}

- 이처럼 globals()를 사용하여 모듈에 있는 *_promo()함수를 리스트에 추가하여 처리할 수 있음

- 아래는 promotions 모듈을 내부 조사해서 만든 promos 리스트

{% highlight python %}
import inspects

promos = [func for name, func in
             inspect.getmembers(promotions, inspect.isfunction)]

def best_promo(order):
    return max(promo(order) for promo in promos)
{% endhighlight %}

<hr/>

## 명령(Command)

> argments로 전달된 함수를 사용하는 디자인 패턴

- Application(클라이언트), Menu(실행기), Command(명령), OpenCommand(구체적인 명령1), PasteCommand(구체적인 명령2)등으로 이뤄진 패턴
- 연산을 실행하는 객체와 연산을 구현하는 객체를 분리하는 방법
     - Receiver : 구현하는 제공자 객체
     - Invoker : 오퍼레이션을 호출하는 객체
- 이 때 execute()라는 함수이름으로 모두 일치해서 구체적인 명령을 만들 수도 있지만
- 객체 자체를 호출가능한 형태로 만들면 더 간결하게 구현할 수 있음
- __call__()함수를 구현해서 호출가능한 객체를 만들 수 있음
    - 모든 파이썬의 callabe 한 객체는 단일 메소드 인터페이스를 구현하며 그 메소드 이름은 call이다.

{% highlight python %}
class MacroCommand:
    def __init__(self, commands):
        self.commands = list(commands)

    def __call__(self):
        for command in self.commands:
            command()

MacroCommand()
{% endhighlight %}

