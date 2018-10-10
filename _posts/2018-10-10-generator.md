---
layout: post
title: "반복형, 반복자, 제네레이터"
author: "sungsoo"
---

## Sentence 버전 #1: 단어 시퀀스

{% highlight python %}
import re
import reprlib

RE_WORD=re.compile(r'\w+')

class Sentence:

    def __init__(self,text):
        self.text=text
        self.words=RE_WORD.findall(text)

    def __getitem__(self,index):
        return self.words[index]

    def __len__(self):
        return len(self.words)

    def __repr__(self):
        return "Sentence(%s)" % reprlib.repr(self.text)



    s=Sentence('"The Time has come, "the walrus said,')     
    for word in s:
        print(word)         

    print(list(s))          ['The', 'Time', 'has', 'come', 'the', 'walrus', 'said']
{% endhighlight %}


## Sequence 가 반복 가능한 이유 : iter() 함수
- 파이썬 인터프리터가 x 객체를 반복할 때 iter(x)를 자동으로 호출한다.
- __iter__() 가 구현되어 있지 않지만 __getitem__() 이 구현되어 있다면, 파이썬은 인덱스 0에서 시작해서 항복을 순서대로 가져오는 반복자를 생성한다.
- 이 과정이 실패하면 TypeError가 발생한다.

##  반복형과 반복자
- 반복형과 반복자의 관계 : 반복형 객체에서 반복자를 가져오는 것
- 'ABC' 라는 문자열은 반복형이라면 반복자는 __iter__() 호출을 통해 반환된 값이다.
- 반복자가 모두 소진되면 StopIteration 예외를 발생시킨다.


{% highlight python %}

s='ABC'
it=iter(s)
while True:
    try:
    print(next(it))
    except StopIteration:
    del it
    break

{% endhighlight %}

## 고전적인 반복자
- 디자인 패턴을 따르는 고전적인 구현 방법
- 반복형 클래스와 iter, next 를 모두 구현하여, 반복형 컬렉션과 반복자 객체 간의 관계를 명확히 정의한다.


{% highlight python %}
import re
import reprlib

RE_WORD = re.compile(r'\w+')


class Sentence:
    def __init__(self, text):
        self.text = text
        self.words = RE_WORD.findall(text)

    def __repr__(self):
        return "Sentence(%s)" % reprlib.repr(self.text)

    def __iter__(self):
        return SentenceIter(self.words)


class SentenceIter:
    def __init__(self, words)
        self.words = words
        self.index = 0

    def __next__(self):
        try:
            word = self.words[index]
        except IndexError:
                raise StopIteration()
            self.index += 1
            return word

    def __iter__(self):
        return self

{% endhighlight %}

- 하지만 이 방법은 반복형과 반복자를 만드는데 있어서 둘을 혼동 할 수 가 있다.


# 제네레이터 함수
- 별도의 반복자 필요 없이 파이썬 스럽게 구현이 가능하다.
- __iter__() 는 제네레이터 함수이다.
{% highlight python %}
class Sentence:

    def __init__(self, text)
        self.text = text
        self.words = RE_WORD.findall(text)

    def __repr__(self):
        return "Sentence(%s)" % reprlib.repr(self.text)

    def __iter__(self):
        for word in self.words:
            yield word
        return

{% endhighlight %}

# 느긋한 구현
- Iterator 인터페이스는 느긋하게 처리하도록 설계되어 있다. 
- next()는 한번에 한 항목만 생성한다.
- 값 생산을 연기하여 메모리를 줄일 수 있을 뿐 아니라 불필요한 처리를 피하도록 한다.

{% highlight python %}
class Sentence:
    def __init__(self, text):
        self.text = text

    def __repr__(self):
        return " Sentence (%s) " % reprplib.repr(self.text)

    def __iter__(self):
        for match in RE_WORD.findall(self.text):
            yield match.group()

{% endhighlight %}


# 제네레이터식 표현
- 지능형 리스트의 느긋한 버전이라고 생각해라
- 필요에 따라 항목을 느긋하게 생성하는 제네레이터를 반환


{% highlight python %}

def gen_AB():
    print('start')
    yield 'A'
    print('continue')
    yield 'B'
    print('end')
    yield 'C'


res = [x*3 for x in gen_AB()]

print(res)      #['AAA', 'BBB', 'CCC']

res2 = (x*3 for x in gen_AB())  

print(res2)     # <generator object <genexpr> at 0x0000019B2DD91EB8>

for i in res2:
    print(i, "-->")         # AAA--> BBB--> CCC-->

{% endhighlight %}


-- 제네레이터 표현식을 적용한 Sentence 클래스
{% highlight python %}
    def __iter__(self):
        return (match.gropu() for match in RE_WORD.findall(self.text))

{% endhighlight %}

# yield from


{% highlight python %}
def chain(*iterables):
    for it in iterables:
        for i in it:
            yield i

def chain(*iterables):
    for i in iterables:
        yield from i

s = 'ABC'
t = tuple(range(3))

rs = list(chain(s, t))
print(rs)  # ['A', 'B', 'C', 0, 1, 2]
{% endhighlight %}

# 제네레이터를 이용한 등차수열 구현, 표준라이브러리의 제네레이터 함수 부분은 보완하겠습니다. ^_^