var CurveControl = function() {
  var allAnimations = {}

  // Our data stuff
  var animating = false,
      curveHeight,
      curveWidth,
      decay = false,
      endTime,
      firstVector,
      lastVector,
      relativeTrackedCurveVectors = [],
      startTime,
      time = 0,
      timeDecayPerTick = 0,
      totalTime = 0,
      trackedCurveVectors = [],
      trackingUserDrawingCurve = false

  // Event types
  var startTrackingEventName = isTouch() ? "touchstart" : "mousedown",
      endTrackingEventName = isTouch() ? "touchend" : "mouseup",
      trackingEventName = isTouch() ? "touchmove" : "mousemove"

  // Our stage
  var stage = document.querySelector(".curve-control"),
      canvas = stage.querySelector(".curve"),
      context = canvas.getContext("2d"),
      proof = stage.querySelector(".proof"),
      trackedCurves = stage.querySelector(".tracked-curves"),
      currentIndicator = null
  

  trackedCurves.addEventListener("click", function(event) {
    event.preventDefault()
    var animationName = event.target.dataset.animationName
    if (!animationName)
      return

    trackedCurveVectors = allAnimations[animationName].absolute || []
    relativeTrackedCurveVectors = allAnimations[animationName].relative || []
    renderCurve()

    disableCurrentIndicators()

    var indicator = stage.querySelector(".indicator[data-animation-name=" + animationName + "]")
    indicator.classList.add("current")

  })

  canvas.addEventListener("touchmove", function(event) {
      event.preventDefault()
  }, false)

  // Canvas wants explicit size for pretty rendering
  var fitCanvas = function() {
    canvas.width = curveWidth = canvas.parentNode.clientWidth
    canvas.height = curveHeight = canvas.parentNode.clientHeight  
  }
  fitCanvas()
  window.addEventListener("resize", fitCanvas)

  stage.addEventListener("scroll", function(event) {
    event.preventDefault()
  })

  proof.addEventListener("click", function() {
    if (proof.style.webkitAnimationPlayState !== "paused") {
      proof.style.webkitAnimationPlayState =  "paused"
      proof.classList.add("pause")
    } else {
      proof.style.webkitAnimationPlayState =  "running"
      proof.classList.remove("pause")
    }
  })

  // Capture proof animation start
  proof.addEventListener("webkitAnimationStart", function(event) {
    console.log("start animate", event)
  }, false)

  // Capture proof animation end
  proof.addEventListener("webkitAnimationEnd", function(event) {
    console.log("end animate", event)
  }, false)

  // Capture proof animation iteration
  proof.addEventListener("webkitAnimationIteration", function(event) {
    console.log("iterate animate", event)
  }, false)

  // Start tracking of the curve
  var beginTrackingOfUserDrawingCurve = function(event) {
    startTime = new Date().getTime()
    trackedCurveVectors = []
    relativeTrackedCurveVectors = []
    trackingUserDrawingCurve = true
  }
  canvas.addEventListener(startTrackingEventName, beginTrackingOfUserDrawingCurve)

  // End tracking of the curve
  var endTrackingOfUserDrawingCurve = function(event) {
    endTime = new Date().getTime()
    totalTime = endTime - startTime
    trackingUserDrawingCurve = false
    decay = false

    var startVector = trackedCurveVectors[0],
        endVector = trackedCurveVectors[trackedCurveVectors.length - 1]
    
    if (!endVector || !startVector)
      return
    
    relativeTrackedCurveVectors = []
    fullWitdh = endVector.x - startVector.x,
    fullHeight = curveHeight

    for (var i = 0; i < trackedCurveVectors.length; i++) {
      var absoluteVector = trackedCurveVectors[i],
          relativeVector = {}

      relativeVector.x = (absoluteVector.x - startVector.x) / fullWitdh
      relativeVector.y = 1 - absoluteVector.y / fullHeight
      relativeTrackedCurveVectors.push(relativeVector)
    }

    var generatedAnimationName = generateCSSAnimationStyles(document.styleSheets[1]),
        indicatorTemplate = stage.querySelector(".indicator:last-child"),
        indicator = indicatorTemplate.cloneNode(true),
        proof = indicator.querySelector(".proof")


    allAnimations[generatedAnimationName] = {
      absolute: trackedCurveVectors,
      relative: relativeTrackedCurveVectors
    }

    disableCurrentIndicators()

    indicator.classList.add("active")
    indicator.classList.add("current")
    currentIndicator = indicator
    
    indicator.dataset.animationName = generatedAnimationName
    proof.dataset.animationName = generatedAnimationName
    proof.style.webkitAnimationName = ""
    proof.style.webkitAnimationPlayState = "paused"

    indicatorTemplate.parentNode.insertBefore(indicator, indicatorTemplate.parentNode.firstChild)

    setTimeout(function() {
      proof.classList.add(generatedAnimationName)
      proof.style.webkitAnimationDuration =  totalTime + "ms"
      proof.style.webkitAnimationPlayState =  "running"
      proof.style.webkitAnimationName =  generatedAnimationName
      proof.style.webkitAnimationIterationCount = "infinite"
    }, 0)

    firstVector = null
    lastVector = null
  }
  canvas.addEventListener(endTrackingEventName, endTrackingOfUserDrawingCurve)


  // Track the user drawing a curve
  var trackUserDrawingCurve = function(event) {
    if (!trackingUserDrawingCurve)
      return

    var vector
    if (event.targetTouches) {
      vector = { x: event.targetTouches[0].pageX, y: event.targetTouches[0].pageY }
      vector.y -= 64
    } else {
      vector = { x: event.offsetX, y: event.offsetY }
    }

    if (lastVector && lastVector.x > vector.x)
      vector.x = lastVector.x

    trackedCurveVectors.push(vector)
    lastVector = vector
    
    if (trackedCurveVectors.length === 1) {
      firstVector = vector
      time = 0
      decay = true
    }

    renderCurve() // Render
  }
  canvas.addEventListener(trackingEventName, trackUserDrawingCurve)


  // Generate the CSS animation string
  var curveAnimationIterationCount = 0
  var generateCSSAnimationStyles = function(parentStyleSheet) {
    curveAnimationIterationCount++
    var name = "curve-animation-" + curveAnimationIterationCount
        css = "@-webkit-keyframes " + (name || "curve-animation") + " {\n"
    for (var i = 0; i < relativeTrackedCurveVectors.length; i++) {
      var relativeVector = relativeTrackedCurveVectors[i]
      css += (relativeVector.x * 100) + "% { opacity: " + relativeVector.y + ";\n"
      css += "-webkit-transform: scale(" + relativeVector.y +"); }\n";
    }
    css += "}"

    var cssClass = "." + name + " {\n"
    cssClass += "-webkit-animation: " + name + " " + totalTime + "s infinite;\n"
    cssClass += "}"
    
    setTimeout(function() {
      parentStyleSheet.insertRule(css, 0)
      parentStyleSheet.insertRule(cssClass, 0)
    }, 0)

    return name
  }


  // Find the css rules
  var getCSSRuleForAnimation = function(animationName) {
    var allStyleSheets = document.styleSheets
    for (var i = 0; i < allStyleSheets.length; i++) {
      var rules = allStyleSheets[i].cssRules
      for (var j = 0; j < rules.length; j++) {
        var rule = rules[j]
        console.log(rule.type)
        if (rule.type === window.CSSRule.WEBKIT_KEYFRAMES_RULE && rule.name === animationName) {
          return rule
        }
      }
    }
    return null
  }

  // Remove refences to current curve representation 
  var disableCurrentIndicators = function() {
    var currents = stage.querySelectorAll(".current")
    for (var i = 0; i < currents.length; i++) {
      currents[i].classList.remove("current")
    }
  }


  // The curve on canvas render method
  var renderCurve = function() {
    if (animating)
      window.requestAnimationFrame(tick)
    
    if (decay)
      time += timeDecayPerTick

    context.save()
    context.clearRect(0, 0, curveWidth, curveHeight)

    context.globalAlpha = 0.2
    context.strokeStyle = "#CEBF55"
    context.strokeWidth = 0.1
      
    // center line
    context.beginPath()
    context.moveTo(0, curveHeight / 2)
    context.lineTo(curveWidth, curveHeight / 2)
    context.closePath()
    context.stroke()

    // startline
    if (firstVector) {
      context.save()
      context.strokeStyle = "#CA96B8"
      context.globalAlpha = 0.5;
      context.beginPath()
      context.moveTo(firstVector.x, 0)
      context.lineTo(firstVector.x, curveHeight)
      context.closePath()
      context.stroke()
      context.restore()
    }

    context.fillStyle = "#FFFFFF"

    context.save()
    context.globalAlpha = 0.4;
    context.beginPath()
    for (var i = 0; i < trackedCurveVectors.length; i++) {
      var trackedVector = trackedCurveVectors[i],
          vector = {
        x: trackedVector.x,
        y: trackedVector.y
      }
      context.fillRect(vector.x - 1, vector.y - 1, 2, 2)
      context.lineTo(vector.x, vector.y)
    }
    context.globalAlpha = 0.3;
    context.stroke()
    context.closePath()
    context.restore()
    context.restore()
  }
  renderCurve() // Start the animation loop
}

// Are we on a touch device (e.g. iPad, iPhone, Android)
var isTouch = function() {
  return ('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch
}
