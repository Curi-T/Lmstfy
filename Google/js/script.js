/**
 * 让我帮你百度一下【重制版】
 * GitHub 开源地址：https://github.com/mengkunsoft/lmbtfy
 **
 * 原始版本来自 bangbang(http://lmbtfy.cn/)，mengkun(https://mkblog.cn) 在原作的基础上进行了重制，风格变更为新版百度 UI，并适配了移动端
 * 交互效果参考了 不会百度么？(http://buhuibaidu.me/)
 **
 * 转载或使用时，还请保留以上信息，谢谢！
 */

/* 低版本 IE polyfill */
if (!window.location.origin) {
    window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
}

/* 扩展一个getUrlParam的方法 */
$.getUrlParam = function (name) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == name) { return pair[1]; }
    }
    return (false);
};

$(function () {
    var $kw = $('#kw'),
        $searchSubmit = $('#search-submit'),
        $urlOutput = $('#url-output'),
        $tips = $('#tips'),
        $stop = $('#stop'),
        $arrow = $('#arrow');

    var stepTimeout, typeInterval;

    /* 获取并解析查询参数 */
    var query = $.getUrlParam('q');
    if (!!query) {
        try {
            query = Base64.decode(query);
        } catch (e) {
            console.log(e);
        }
    }

    /* 有参数，启动百度教程 */
    if (!!query) {
        $tips.html('让我来教你正确的打开方式');
        $stop.fadeIn();

        stepTimeout = setTimeout(function () {
            $tips.html('1、找到输入框并选中');

            $arrow.removeClass('active').show().animate({
                left: $kw.offset().left + 20 + 'px',
                top: ($kw.offset().top + $kw.outerHeight() / 2) + 'px'
            }, 2000, function () {
                $tips.html('2、输入你要找的内容');
                $arrow.addClass('active');

                stepTimeout = setTimeout(function () {
                    $arrow.fadeOut();
                    //  获取输入框的内容
                    var separator = /url(@|#|&|=)/i;
                    var q = query.split(separator,3);
                    var content = q[0];

                    var i = 0;
                    typeInterval = setInterval(function () {
                        $kw.val(content.substr(0, i));
                        if (++i > content.length) {
                            clearInterval(typeInterval);
                            $tips.html('3、点击下“Google”按钮');

                            $arrow.removeClass('active').fadeIn().animate({
                                left: $searchSubmit.offset().left + $searchSubmit.width() / 2 + 'px',
                                top: $searchSubmit.offset().top + $searchSubmit.height() / 2 + 'px'
                            }, 1000, function () {
                                $tips.html('<strong>怎么样，学会了吗？</strong>');
                                $arrow.addClass('active');

                                stepTimeout = setTimeout(function () {
                                    var u = $.getUrlParam('u');

                                    //  判断参数是否有url
                                    var patt = new RegExp(separator)
                                    if (patt.test(query)) {
                                        var url = q[2];
                                        //  判断url是否有https，无则加上
                                        if (url.indexOf('https://') == -1 && url.indexOf("http://") == -1)
                                            url = 'https://' + url;
                                        window.location = url;
                                    } else {
                                        //  否则直接进行百度搜索 content
                                        window.location = 'https://www.google.com/search?q=' + encodeURIComponent(query);
                                    }
                                }, 1000);
                            });
                        }
                    }, 200);
                }, 500);
            });
        }, 1000);
    }

    /* 自己人，停下 */
    /*
    $stop.click(function () {
        clearTimeout(stepTimeout);
        clearInterval(typeInterval);
        $stop.hide();
        $arrow.stop().hide();
        $kw.val(query);
        query = false;
        $tips.html('输入一个问题，然后点击Google一下');
    });
    */

    /* 提交 */
    $('#search-form').submit(function () {
        if (!!query) return false;

        $('#QRCodeImg').fadeOut();
        var question = $.trim($kw.val());
        if (!question) {
            $tips.html('<span style="color: red">搜了个寂寞？</span>');
            $kw.val('');
        } else {
            $tips.html('↓↓↓ 复制下面的链接，教伸手党使用Google');
            $('#output').fadeIn();
            $('#shortUrlDiv').css('display','none');
            $urlOutput.val(window.location.origin + window.location.pathname + '?q=' + Base64.encode(question)).focus().select();
        }
        return false;
    });

    /* 复制结果 */
    var clipboard = new ClipboardJS('[data-clipboard-target]');
    clipboard.on('success', function (e) {
        $tips.html('<span style="color: #4caf50">复制成功！赶紧把链接甩给伸手党们！</span>');
    });
    clipboard.on('error', function (e) {
        $tips.html('<span style="color: red">复制失败，请手动复制...</span>');
    });

    /*  短链接生成   */
    $('#shortUrl').click(function () {
        var text = $tips.html();
        $tips.html('网络较慢，耐心等待，建议使用其他短链接');
        $('#shortUrlDiv').fadeIn();
        $.ajax({
            url: 'http://a.bbest.me/short/create',
            type: "POST",
            data: {
                l:  $urlOutput.val(),
            },
            crossDomain: true,
            success: function(data){
                $urlOutput.val('http://www.bbest.me/' + data.short_url);
                $tips.html(text);
            },
            error: function () {
                $tips.html("短链接生成失败，请复制下方链接到新出现的友链中生成")
                flag = false;
            },
            dataType: "json"
        });
    })

    /*  二维码  */
    $('#QRCodeBut').click(function () {
        $('#QRCodeImg').attr('src','http://a.bbest.me/short/QRCode?q=' + $urlOutput.val());
        $('#QRCodeImg').fadeIn()
    });

    /* 预览 */
    $('#preview').click(function () {
        var link = $urlOutput.val();
        if (!!link) {
            window.open(link);
        }
    });
});