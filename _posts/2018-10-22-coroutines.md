---
layout: post
title: "Coroutines"
author: "Badhorror"
---
# Coroutines

## How coroutines evolved from generators

> 코루틴 최신 변경 사항
>> 생성자는 값을 반환 할 수 있다
>>
>> yield 문법은 복잡한 생성자를 간단하게 할수 있음

## Basic behavior of a generator used as a coroutine

```py
>>> def simple_coroutine():  # 코루틴은 생성자 함수로 정의됨
...     print('-> coroutine started')
...     x = yield  # yield는 표현식에 사용된다. 코루틴이 클라이언트로부터 데이터를 수신하기 위해 설계된 경우 none을 산출함 - yield 키워드 오른쪽에 표현이 없으면 함축적으로 none
...     print('-> coroutine received:', x)
... >>> my_coro = simple_coroutine() >>> my_coro  # 보통 생성자 오브텍트를 얻기위해 펑션콜함
<generator object simple_coroutine at 0x100c2be10>
>>> next(my_coro)  # 최초콜은 next() 왜냐면 생성자가 시작되지않았다. 따라서 yield 에서 기다리지 않고 초기에 데이터를 보낼수 없다.
-> coroutine started
>>> my_coro.send(42)  # 코루틴 본문의 yield를 42로 수행. 이제 코루틴은 yield 또는 종료까지 실행
-> coroutine received: 42
Traceback (most recent call last):  # 이경우 코루틴 바디 ????
```

- 코루틴은 4개 중 한개 상태를 갖을수 있음(inspect.getgeneratorstate(…) function 으로 확인가능)
   - GEN_CREATED : 실행 대기
   - GEN_RUNNING : 인터프리터 실행중
   - GEN_SUSPENDED : yield에 의해 중단
   - GEN_CLOSED : 실행 완료

- 코루틴은 send 메소드에 대한 아규먼트가 보류중인 yield 값이 되므로 코루틴이 현재 일시 중단 된 경우만 my_coro.send(42) 같은 콜이 가능
- 단 코루틴이 활성화 된적이없는 경우(GEN_CREATED) 인 경우에는 해당 되지않는다. 이것이 바로 코루틴의 첫번째 활성화가 항상 next(my_coro)와 수행되는 이유이다. my_coro.send(none)도 호출가능하며 효과는 같다

```py
#next 안하면 발생하는 케이스
>>> my_coro = simple_coroutine()
>>> my_coro.send(1729)
Traceback (most recent call last):
File "<stdin>", line 1, in <module>
TypeError: can't send non-None value to a just-started generator
```

```py
>>> def simple_coro2(a):
...     print('-> Started: a =', a)
...     b = yield a
...     print('-> Received: b =', b)
...     c = yield a + b
...     print('-> Received: c =', c)
...
>>> my_coro2 = simple_coro2(14)
>>> from inspect import getgeneratorstate
>>> getgeneratorstate(my_coro2)   #GEN_CREATED 즉 아직 코루틴이 시작되지 않음
'GEN_CREATED'
>>> next(my_coro2)   # 코루틴 첫 yield, 출력 -> started : a = 14 메세지 표시 이후 a값을 얻고 b값을 얻기위해 일시 중단
-> Started: a = 14
14
>>> getgeneratorstate(my_coro2)  # 일시 중단 확인
'GEN_SUSPENDED'
>>> my_coro2.send(28)  # 중지된 코루틴에 28 보내고 yield는 28 수행 후 b에 바인드. b=28 메세 표시하고 a+b 계산후 c에 지정될동안 일시 중단됨
-> Received: b = 28
42
>>> my_coro2.send(99)  # 중지된 코루틴에 99 보낸후 c숫자에 바인딩, c = 99 메세지 표시 이후 코루틴이 종료되어 생성자 객체가 stopIteration 발생
-> Received: c = 99
Traceback (most recent call last):
 File "<stdin>", line 1, in <module>
 StopIteration
 >>> getgeneratorstate(my_coro2)  #코루틴 실행 완료 확인
 'GEN_CLOSED'
```

- 코루틴의 실행이 yield 키워드에서 정확하게 중단되는것을 이해해야함
- 할당 문에서 = 오른쪽에 있는 코드는 실제 할당이 발생하기 전에 수행됨. 이는  b=yield와 같은 줄에서 b의 값은 나중에 클라이언트 코드에 의해 코루틴이 활성화 될때만 설정된다는 것을 의미.
1. next(my_coro2)는 첫번째 메세지를 프린트하고 실행하여 yield a 가 14
2. my_coro2.send(28)은 B에 28 할당하고 2번째 메세지 프린트하고 실행하여 a+b 를 계산함 42
3. my_coro2.send(99)는 99에 c를 지정하고 세번째 메세지 프린트후 코루틴 종료

## Example: coroutine to compute a running average

```py
def averager():
    total = 0.0
    count = 0
    average = None
    while True: # 해당 무한 루프는 코루틴 발신자가 전송한 갑을 받아들이고 결과를 생성하는 것을 계속 유지함을 의미. 이 코루틴은 호출자가 .close()를 호출할떄 또는 더이상 참조가 없어 GC될때만 종료
      term = yield average # yiled 문은 코루틴을 일시 중단하고 호출자에게 결과를 생성하며 호출자가 무한루프를 다시 시작하는 코루틴으로 보낸값을 얻는데 사용된다
      total += term
      count += 1
      average = total/count
```

- 코루틴을 사용할 때 이점은 total과 count가 간단한 지역 변수가 될수 있다
- 호출간에 컨텍스트를 유지하기 위해 인스턴스 속성이나 클로저가 필요하지 않다

``` py
>>> coro_avg = averager() # 코루틴 객체 생성
>>> next(coro_avg) # next 호출(none이 센드되서 표시없이 대기)
>>> coro_avg.send(10) #  현재 평균 send
10.0
>>> coro_avg.send(30)
20.0
>>> coro_avg.send(5)
15.0
```

## Decorators for coroutine priming

> 코루틴을 priming 없이 많은것을 할수없음
>
> 프라이밍 데코레이터를 사용해서 코루틴 사용을 편리하게 할수있음

```py
from functools import wraps
def coroutine(func):
  """Decorator: primes `func` by advancing to first `yield`"""
  @wraps(func)
  def primer(*args,**kwargs): # 데코레이팅된 생성자 펑션은 프라이머 펑션으로 대체된다. 이 펑션은 호출될때 프라이밍된 생성자를 반환한다
    gen = func(*args,**kwargs) # 데코레이팅된 펑션을 호출하여 생성자 객체 할당
    next(gen) # 생성자 프라임
    return gen # 반환
  return primer

  >>> coro_avg = averager() # 코루틴 데코레이터된 프라임 생성자 호출
  >>> from inspect import getgeneratorstate
  >>> getgeneratorstate(coro_avg) # 코루틴 대기 확인
  'GEN_SUSPENDED'
  >>> coro_avg.send(10) # coro_avg에 값을 보내는 작업이 즉시 시작할수있음 이것이 데코레이터 핵심임
  10.0
  >>> coro_avg.send(30)
  20.0
  >>> coro_avg.send(5)
  15.0
  from coroutil import coroutin # 코루틴 데코레이터를 가져온다
  @coroutine # 펑션에 적용
  def averager(): # 위 예제랑 같은거임
    total = 0.0
    count = 0
    average = None
    while True:
      term = yield average
      total += term
      count += 1
      average = total/count
```

- 여러 프레임 워크는 코루틴과 함께 작동하도록 설계된 특수 데코레이터를 제공함
- 모두가 실제로 코투린을 준비하지는 않는다. 어떤것은 이벤트 루푸에 연결같이 다른 서비스를 제공한다.

## Coroutine termination and exception handling

> 코루틴 내 처리되지 않은 예외는 다음 호출자에게 전파되거나 트리거된 호출자에게 전파됨

```py
>>> from coroaverager1 import averager
>>> coro_avg = averager()
>>> coro_avg.send(40)  # @coroutine 데코레이팅된 averager를 사용하여 즉시 값 send 가능
40.0
>>> coro_avg.send(50)
45.0
>>> coro_avg.send('spam')  # 숫자가 아닌 값을 보내면 코루틴 내부 예외 발생
Traceback (most recent call last):  ...
TypeError: unsupported operand type(s) for +=: 'float' and 'str'
>>> coro_avg.send(60)  # 코루틴 내에서 예외처리가 되지 않았으므로 코루틴이 종료됨 다시 활성화 시도하면 stopIteration 발생
Traceback (most recent call last):  File "<stdin>", line 1, in <module>
StopIteration

- spam 값 send로 예외 발생
- 파이썬 2.5 이후 생성자 객체는 2메소드로 명시적으로 예외를 코루틴으로 보내고 닫을수 있다(throw, close)

```py
def demo_exc_handling():
  print('-> coroutine started')
  while True:
    try:
      x = yield
    except DemoException: #demoexception 특수 처리
      print('*** DemoException handled. Continuing...')
    else: # 예외가 없으면 값 표시
      print('-> coroutine received: {!r}'.format(x))
    raise RuntimeError('This line should never run.') # 이행은 절대 실행되지 않는다
```

- 위 예제에서 마지막 라인은 수행될수 없다. 무한루프는 unhandled exception로만 중단되며 바로 코루틴을 종료한다
- try, finally 사용 가능

## Returning a value from a coroutine

```py
from collections import namedtuple

Result = namedtuple('Result', 'count average')

def averager():
  total = 0.0
  count = 0
  average = None
  while True:
    term = yield
    if term is None:
      break # 값을 반환할려면 코루틴이 정상종료가 되야함, 해당 예제가 루프를 벗어나는 조건이 있는 이유임
    total += term
    count += 1
    average = total/count
  return Result(count, average) # count와 average를 가지는 튜플을 리턴함. 파이썬3.3 이전에는 생성자 펑션 리턴은 구문오류였음.
```
- 반환 식의 값은 stopIteration 예외 특성으로 호출자에게 밀려 나게 됨
- 이는 해킹 비트이지만 생성자 객체의 기존동작을 보존한다.

```py
 >>> coro_avg = averager()
 >>> next(coro_avg)
 >>> coro_avg.send(10)
 >>> coro_avg.send(30)
 >>> coro_avg.send(6.5)
 >>> try:
 ...     coro_avg.send(None)
 ... except StopIteration as exc:
 ...     result = exc.value
 ...
 >>> result
 Result(count=3, average=15.5)
```


## Using yield from

> yield from은 완전히 새로운 언어 구조

```py
>>> def gen():
...     for c in 'AB':
...         yield c
...     for i in range(1, 3):
...         yield i
...
>>> list(gen()) ['A', 'B', 1, 2]

Can be written as:

>>> def gen():
...     yield from 'AB'
...     yield from range(1, 3)
...
>>> list(gen()) ['A', 'B', 1, 2]
```

```py
>>> def chain(*iterables):
...     for it in iterables:
...         yield from it
...
>>> s = 'ABC'
>>> t = tuple(range(3))
>>> list(chain(s, t))
['A', 'B', 'C', 0, 1, 2]
```

- yield from x  표현식은 x 오브젝트 iter(x)를 호출하여 iterator를 얻는것이다. 즉 x는 반복 가능할수있다.
- yield 의 가장 큰 특징은 가장 바깥쪽 호출자에게 가장 안쪽 하위 생성자까지 양방향 채널을 열어 값을 직접 주고 바을 수 있으며 예외를 던질수 있는점

```py
from collections import namedtuple

Result = namedtuple('Result', 'count average')

# the subgenerator
def averager(): # 하위 생성자
  total = 0.0
  count = 0
  average = None
  while True:
    term = yield # 메인에있는 클라이언트 코드로 보내지는 값은 term에 바인딩됨
    if term is None: # 종료조건
      break
    total += term
    count += 1
    average = total/count
    return Result(count, average) # 리턴 결과는 grouper 표현식에서 얻은 yield 값임

# the delegating generator
def grouper(results, key): # grouper는 델리게이트 생성자임
  while True: # 이루프 각 반복은 averager의 새로운 인스턴스를 생성함. 각각은 코루틴으로 작동하는 생성자 객체임
    results[key] = yield from averager() #grouper는 send마다 평균값 인스턴스로 파이프됨.

# the client code, a.k.a. the caller
def main(data): # 클라이언트 코드 또는 호출자
  results = {}
  for key, values in data.items():
    group = grouper(results, key) # group은 결과를 수집하기 위해 결과를 가진 grouper의 특정 키를 호출하여 생성된 생성자 객체임.코루틴으로 작동
    next(group) #  코루틴 준비
    for value in values:
      group.send(value) # #각 값을 grouper로 전달함. 이 값은 term = yield (averager의). grouper는 절대 볼수없음
    group.send(None) # important! none을 grouper로 send하면 현재 average 인스턴스가 종료되고 grouper가 다시 실행 될수있다. 그러면 다음 그룹의 값에 대해 다른 평균을 만든다

  # print(results)  # uncomment to debug
  report(results)

# output report
def report(results):
  for key, result in sorted(results.items()):
    group, unit = key.split(';')
    print('{:2} {:5} averaging {:.2f}{}'.format(result.count, group, result.average, unit))

data = {
  'girls;kg':
    [40.9, 38.5, 44.3, 42.2, 45.2, 41.7, 44.5, 38.0, 40.6, 44.5],
  'girls;m':
    [1.6, 1.51, 1.4, 1.3, 1.41, 1.39, 1.33, 1.46, 1.45, 1.43],
  'boys;kg':
    [39.0, 40.8, 43.2, 40.8, 43.1, 38.6, 41.4, 40.6, 36.3],
  'boys;m':
    [1.38, 1.5, 1.32, 1.25, 1.37, 1.48, 1.25, 1.49, 1.46],
}

if __name__ == '__main__':
  main(data)
```


## The meaning of yield from

1. 하위 생성자가 생성하는 모든 값은 델리게이트된 생성자의 호출자 즉 클라이언트 코드에 직접 전달됨
2. send()를 사용하여 델리게이트 생성자로 send된 모든값은 직접 하위 생성자로 전달됨. 전송된 값이 none이면 하위 생성자의 __next__메서드가 호출됨. 전송된 값이 none이 아니면 하위 생성자의 send()메서드가 호출됨. 호출이 stopIteration을 발생시키면 델리게이트된 생성자가 다시 시작됨. 다른 예외는 델리게이트 생성자로 전달됨
3. 생성자(또는 하위 생성자)에서 expr을 반환하면 생성자가 종료될때 stopIteration(expr)이발생
4. 표현식 yield 값은 하위 생성자가 종료될때 발생하는 stopIteration 예외에 대한 첫번째 인수임
5. 델리게이트 생성자로 trhow 된 GeneratorExit이외에 예외는 하위 생성자의 trhow() 메서드에 전달됨. stopIteration 호출이 발생되면 델리게이트 생성자가 다시 시작됨 다른 예외는 델리게이트 생성자로 전달됨.
6. 델리게이트 생성자에 GeneratorExit예외가 throw 되거나 위이 생성자의 colse()메서드가 호출된경우 하위 생성자의 close()메서드가 호출되몀. 이 호출에 예외가 발생하면 델리게이트 생성자로 전달됨. 그렇지 않으면 델리게이트 생성자에서 GeneratorExit가 발생함


```py
_i = iter(EXPR) # EXPR은 iter()가 하위 생성자를 가져오는데 적용되므로 모든 반복 가능 항목이 될수있음
  try:
    _y = next(_i) # 하위생성자는 초기화 되어있다. 결과는 첫번째로 수행된 값_y로 할당
  except StopIteration as _e:
    _r = _e.value # stopIter 발생하면 예외에서 값 추출하고 _r에 할당. 가장 간단한 경우는 RESULT
  else:
    while 1: # 이루프가 실행 되는 동안 델리게이트 생서자는 호출자와 하위 생성자 사이의 채널처럼 작동하여 차단됨
      _s = yield _y # 하위 생성자에서 가져온 현재 항목을 갖고옴. 호출자가 보낸 _s 값을 기다리며 이 리스트 유일한 yield임
      try:
        _y = _i.send(_s) # 하위 생성자가 _s 호출자에게 전달함
      except StopIteration as _e: # 하위 생성자가 stopIter 를 발생시키면 값을 가져와서 _r에 할당하고 루프를 종료하며 델리게이트 생성자를 다시 시작함
        _r = _e.value
        break
RESULT = _r # 전체 yield 값
```
- 위 수드코드는 항상 클라이언트의 next 또는 send 호출로 전달함
- 현실은 하위 생성자로 전달되어야하는 클라이언트에서 throw 및 close 호출을 처리해야하기때문에 더욱 복잡함
- 또한 하위 생성자는 throw, close를 지원하지 않는 일반 반복자일수있어 yield로 처리해야함

## Use case: coroutines for discrete event simulatio

> 해당 섹션은 단지 코루틴과 표준 라이브러리 객체를 사용하여 구현된 시뮬레이션을 설명할꺼야.
>
> 코루틴은 asyncio 패키지의 기본 구성 요소야
>
> 시뮬레이션은 쓰레드 대신 코루틴을 사용하여 asnycio를 보여줄꺼야

### About discrete event simulations

> DES는 시스템이 일련의 이벤트로 모델링되는 시뮬레이션이야
>
> DES에서 클럭은 고정된 단위로 진행하지 않고 이벤트의 시간으로 직접 진행해
>
> 예를들어 택시가 승객을 태우면 시간은 중요하지않어 drop off 이벤트가 발생할때만 시간이 업데이트되
>
> 직관적으로 턴 기반 게임같은 시뮬레이션 예임

### The taxi fleet simulation

> 시뮬레이션은 여러 택시가 생성되. 각자는 고정된 수의 운행을 하고 집으로 돌아가
>
> 택시는 차고에서 나와 승객을 찾고 승객을 태우고 운행이 시작될때까지 계속되. 승객이 내리면 택시는 돌아오는 길로 돌아가. 지수 분포를 사용해서 운행이 생성되. 표시는 분단위로하지만 부동소주 간격으로 작동해.
> 승객이 타면 시작하고 승객이 내리면 끝나

```py
def taxi_process(ident, trips, start_time=0): # 택시당 한번 호출되어 작업 나타내는 생성자 객체.ident 택시번호, trips 집에 가기전 가능한 여행 횟수, startTime 차고에서 나가는 시간
  """Yield to simulator issuing event at each state change"""
  time = yield Event(start_time, ident, 'leave garage') #코루틴 일시 중단 시뮬레이션 기본 루프가 다음 예정된 이벤트로 진행.
  for i in range(trips): # trip당 반복 블록
    time = yield Event(time, ident, 'pick up passenger')# 승객 픽업 코루틴은 멈추고 메인 루프가 다시 현재 시간을 보냄
    time = yield Event(time, ident, 'drop off passenger')# 승객 off

  yield Event(time, ident, 'going home')# 지정된 수의 trip후 going home 이벤트 생성. time에 할당하지 않는다
  # end of taxi process  #stopIteration발생
```