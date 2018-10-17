---
layout: post
title: "컨텍스트 관리자와 else 블록"
author: "Polishedwh"
---

## 컨텍스트 관리자와 else 블록
- with 문과 콘텍스트 관리자
- for,while,try 문에서 else 블록

### 이것 다음에 저것: if문 이외에서의 else블록
- for, while
  - loop실행 후 else 블록이 실행된다.
  - loop동작 중에 return, break, continue 등이 실행되면 else 블록은 실행되지 않는다.

- try/except
  - try 블록이 정상 실행 되면 else 블록이 실행된다.
  - else 블록에서 예외가 발생해도 except 구문은 실행되지 않는다.

- EAEP(Easier to Ask for Forgiveness then Permission)
  - 정상 실행됨을 가정하고 일단 동작 시킨다.
  - try/catch 구문이 많다.
  - 파이썬의 코딩 스타일이다.

- LBYL(Leap Before You Leap)
  - 정상 실행되는지를 체크하고 실행한다.
  - if 구분이 많다.

### 컨텍스트 관리자와 with블록
- 컨텍스트 관리자
  - with 문을 실행할 때 컨텍스트를 정의하는 객체이다.
  - 자원의 lock/unlock, 열린 파일의 close 등에 사용한다.
  - object.__enter__(self)
    - 컨텍스트에 진입한다.
    - with문에서 as 절로 지정된 대상이 있으면 이 메서드의 반환 값을 사용한다.(as는 선택적이다)
    - 이 메서드가 정상적으로 반환되면 __exit__가 항상 호출된다.
    - self 이외의 값은 인터프리터에서 전달하지 않는다.

  - object.__exit__(self, exc_type, exc_value, traceback)
    - 컨텍스트를 종료한다.
    - 매개변수를 이용해 종료 상태를 나타낼 수 있다.(없으면 세 변수 모두 None이 됨)
    - __enter__이전에 먼저 로드되고 정상 리턴되면 실행된다.
    - exc_type(ZeroDivisionErro등 예외 클래스), exc_value(예외 객체, 예외 메세지 등), traceback(traceback 객체)

- with 블록은 블록의 실행이 중단되더라도 반드시 실행된다.
  - 중단의 예: 예외발생, return, sys.exit() 등

- with 사용 예
{% highlight python %}
>>> with open('mirror.py') as fp: # Open은 TextIOWrapper 객체를 생성하고 TextIOWrapper.__enter__의 결과값이 fp와 바인딩됨
...
src = fp.read(60)
...
>>> len(src)
60
>>> fp # 변수가 살아있다.
    <_io.TextIOWrapper name='mirror.py' mode='r' encoding='UTF-8'>
>>> fp.closed, fp.encoding # close하면서 with의 __exit__()가 호출된다.
(True, 'UTF-8')
>>> fp.read(60) #
Traceback (most recent call last):
    File "<stdin>", line 1, in <module>
ValueError: I/O operation on closed file.
{% endhighlight %}

- 컨택스트 관리자와 __enter__() 메서드가 반환하는 객체의 차이 
  - LookingGlass 코드 
{% highlight python %}
class LookingGlass:

    def __enter__(self):
        import sys
        self.original_write = sys.stdout.write # 객체 속성의 원래 sys.stdout.write를 임시로 저장
        sys.stdout.write = self.reverse_write # 직접 만든 메서드로 변경(멍키패치??)
        return 'JABBERWOCKY' # 문자열 반환

    def reverse_write(self, text):
        self.original_write(text[::-1])

    def __exit__(self, exc_type, exc_value, traceback): # 정상 수행 완료되면 None, None, None을 인수로 실해됨
        import sys
        sys.stdout.write = self.original_write # 캐시된 원래 메서드로 변경
        if exc_type is ZeroDivisionError:
            print('Please DO NOT divide by zero!')
            return True
{% endhighlight %}

  -  차이를 설명하는 코드
{% highlight python %}
>>> from mirror import LookingGlass
>>> with LookingGlass() as what:
...    print('Alice, Kitty and Snowdrop')
...    print(what)
...
pordwonS dna yttiK ,ecilA # __enter__가 호출되면서 출력됨
YKCOWREBBAJ # 문자열이 반대로 출력됨
>>> what
'JABBERWOCKY' # 위에서 with 블록이 끝났기 때문에 __exit__()가 자동으로 호출되어 정상적으로 출력된다.
>>> print('Back to normal.')
Back to normal.
{% endhighlight %}


- 15-4
{% highlight python %}
>>> from mirror import LookingGlass
>>> manager = LookingGlass() # manager 객체를 생성한다.
>>> manager
<mirror.LookingGlass object at 0x2a578ac>
>>> monster = manager.__enter__() # 컨택스트 관리자의 __enter__를 호출하고 반환값을 저장한다.
>>> monster == 'JABBERWOCKY'
eurT # True
>>> monster
'YKCOWREBBAJ' # 반환값이 역순으로 출력된다.
>>> manager
>ca875a2x0 ta tcejbo ssalGgnikooL.rorrim<
>>> manager.__exit__(None, None, None) # exit 호출로 표준출력이 복구된다.
>>> monster
'JABBERWOCKY'
{% endhighlight %}

### contextlib utilities
- 응용할 수 있는 클래스가 있음


### @contextmanager 사용
- contextlib.contextmanager를 사용해서 좀 더 쉽게 사용 할 수 있다
- contextlib.contextmanager의 실질적인 역할 
  - yield 이전 : __enter__() 객체에 넣어준다.
  - yield 이후 : __exit__() 객체에 넣어준다.

- contextlib.contextmanager의 사용 예
{% highlight python %}
import contextlib

@contextlib.contextmanager # 테커레이터 사용
def looking_glass():
    import sys
    original_write = sys.stdout.write

    def reverse_write(text):
        original_write(text[::-1])

    sys.stdout.write = reverse_write
    yield 'JABBERWOCKY' # yield 로 __enter__, __exit__구분
    sys.stdout.write = original_write
{% endhighlight %}


- 호출하여 상용한 예 
{% highlight python %}
>>> from mirror_gen import looking_glass
>>> with looking_glass() as what:
...    print('Alice, Kitty and Snowdrop')
...    print(what)
...
pordwonS dna yttiK ,ecilA
YKCOWREBBAJ
>>> what
'JABBERWOCKY'
{% endhighlight %}

- 예외처리를 적용하여 좀 더 보완한 사용 예 
{% highlight python %}
import contextlib

@contextlib.contextmanager
def looking_glass():
    import sys
    original_write = sys.stdout.write

    def reverse_write(text):
        original_write(text[::-1])

    sys.stdout.write = reverse_write
    msg = ''
    try:  
        yield 'JABBERWOCKY'
    except ZeroDivisionError:
        msg = 'Please DO NOT divide by zero!'
    finally:
        sys.stdout.write = original_write
        if msg:
            print(msg)
{% endhighlight %}

- 파일을 덮어쓰기 위한 컨텍스트 관리자 
{% highlight python %}
import csv

with inplace(csvfilename, 'r', newline='') as (infh, outfh):
    reader = csv.reader(infh)
    writer = csv.writer(outfh)

    for row in reader:
        row += ['new', 'columns']
        writer.writerow(row)
{% endhighlight %}
