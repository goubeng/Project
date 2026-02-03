// =========================================
// 1. Initialization (改为读取 data.json)
// =========================================
document.addEventListener('DOMContentLoaded', () => {
    // 使用 fetch 请求同目录下的 data.json 文件
    // 注意：这需要通过 VS Code Live Server 运行，直接双击 html 会报错
    fetch('./data.json')
        .then(response => {
            // 检查文件是否成功找到
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            // 解析 JSON 数据
            return response.json();
        })
        .then(data => {
            console.log("数据加载成功:", data);
            // 拿到数据后，调用初始化函数
            initUI(data);
        })
        .catch(error => {
            console.error('无法加载 data.json:', error);
            alert('数据加载失败！\n原因可能是：\n1. 没有使用 VSCode 的 "Live Server" 运行。\n2. data.json 文件路径不对或由语法错误。');
        });
});

// =========================================
// 2. UI Logic (保持不变，接收 data 参数)
// =========================================
function initUI(data) {
    // 头部信息
    setText('pName', data.project_name);
    setText('pCode', data.project_code);
    
    // 检查 team 对象是否存在，防止报错
    if (data.team) {
        setText('pLeader', data.team.leader);
        setText('pManager', data.team.manager);
        setText('pContractor', data.team.contractor);
    }

    setText('updateTime', data.update_time);
    
    if (data.project_timeline) {
        setText('projectPeriod', `${data.project_timeline.start_date} ~ ${data.project_timeline.plan_end_date}`);
        setText('totalDays', data.project_timeline.total_days);
        setText('elapsedDays', data.project_timeline.elapsed_days);
    }

    // 获取当前阶段名称
    if (data.stages) {
        const currentStage = data.stages.find(s => s.status === 'current');
        setText('currentStageText', currentStage ? currentStage.name : '未知阶段');
    }

    // 警报逻辑
    if(data.health_status === 'red' || data.health_score < 60) {
        const alertBanner = document.getElementById('alertBanner');
        if(alertBanner) {
            alertBanner.style.display = 'block';
            // 安全检查，防止 risk 对象不存在导致报错
            const riskHigh = data.risk ? data.risk.high : '?';
            setText('alertDesc', `【严重警告】项目健康分仅 ${data.health_score}分，存在 ${riskHigh} 项高风险问题，建议立即介入督办。`);
        }
    }

    renderKPIs(data);
    renderLifecycle(data);
    renderMilestones(data);

    // 默认显示当前阶段详情
    if (data.stages) {
        const currentIdx = data.stages.findIndex(s => s.status === 'current');
        if(currentIdx !== -1) showStageDetail(currentIdx, data); // 传递 data
    }
}

function setText(id, text) {
    const el = document.getElementById(id);
    if(el) el.innerText = text;
}

// =========================================
// 3. Chart Rendering
// =========================================
function renderKPIs(data) {
    // --- 健康度仪表盘 ---
    const healthChartDom = document.getElementById('healthGauge');
    if (healthChartDom) {
        const hChart = echarts.init(healthChartDom);
        hChart.setOption({
            series: [{
                type: 'gauge',
                startAngle: 180, endAngle: 0,
                min: 0, max: 100,
                radius: '110%',
                center: ['50%', '70%'],
                splitNumber: 5,
                itemStyle: { color: data.health_score < 60 ? '#F53F3F' : '#1664FF' },
                progress: { show: true, width: 12, roundCap: true },
                pointer: { show: true, length: '60%', width: 6, itemStyle: { color: 'auto' } },
                axisLine: { lineStyle: { width: 12, color: [[0.3, '#F53F3F'], [0.7, '#FF7D00'], [1, '#1664FF']] } },
                axisTick: { distance: -18, length: 6, lineStyle: { color: '#fff', width: 2 } },
                splitLine: { distance: -18, length: 12, lineStyle: { color: '#fff', width: 3 } },
                axisLabel: { distance: -35, color: '#999', fontSize: 10 },
                detail: { show: false },
                data: [{ value: data.health_score }]
            }]
        });
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => hChart.resize());
    }

    setText('healthScoreDisplay', data.health_score);
    const hTag = document.getElementById('healthStatusTag');
    if(hTag) {
        if(data.health_score < 60) {
            hTag.innerText = '高风险'; hTag.style.background = '#FFECE8'; hTag.style.color = '#F53F3F';
        } else {
            hTag.innerText = '正常'; hTag.style.background = '#E8FFEA'; hTag.style.color = '#00B42A';
        }
    }

    // --- 进度条 ---
    if (data.progress) {
        const barActual = document.getElementById('barActual');
        if(barActual) barActual.style.width = data.progress.actual + '%';
        setText('txtActual', data.progress.actual + '%');

        const barPlan = document.getElementById('barPlan');
        if(barPlan) barPlan.style.width = data.progress.plan + '%';
        setText('txtPlan', data.progress.plan + '%');
        
        setText('delayDays', Math.abs(data.progress.gap));
    }

    // --- 资金圆环 ---
    const fundChartDom = document.getElementById('chartFund');
    if (fundChartDom && data.fund) {
        const fChart = echarts.init(fundChartDom);
        fChart.setOption({
            color: ['#1664FF', '#F2F3F5'],
            series: [{
                type: 'pie', radius: ['65%', '85%'], center: ['50%', '50%'],
                label: { show: false },
                data: [
                    { value: data.fund.used },
                    { value: data.fund.total - data.fund.used }
                ]
            }]
        });
        window.addEventListener('resize', () => fChart.resize());

        setText('totalFund', data.fund.total);
        setText('remainFund', data.fund.total - data.fund.used);
        setText('fundRate', data.fund.rate + '%');
    }

    // --- 风险圆环 ---
    const riskChartDom = document.getElementById('chartRisk');
    if (riskChartDom && data.risk) {
        const rChart = echarts.init(riskChartDom);
        rChart.setOption({
            color: ['#F53F3F', '#FF7D00', '#1664FF'],
            series: [{
                type: 'pie', radius: ['65%', '85%'], center: ['50%', '50%'],
                label: { show: false },
                data: [
                    { value: data.risk.high },
                    { value: data.risk.medium },
                    { value: data.risk.low }
                ]
            }]
        });
        window.addEventListener('resize', () => rChart.resize());

        setText('riskTotal', data.risk.total);
        setText('riskHigh', data.risk.high);
        setText('riskMid', data.risk.medium);
        setText('riskLow', data.risk.low);
    }
}

// =========================================
// 4. Lifecycle Logic
// =========================================
// 全局变量存储当前数据，以便点击事件使用
let globalStageData = []; 

function renderLifecycle(data) {
    const container = document.getElementById('lifecycleSteps');
    if(!container || !data.stages) return;

    globalStageData = data.stages; // 保存到全局以便 click 使用
    let html = '';
    
    data.stages.forEach((stage, idx) => {
        let statusClass = '';
        let iconHtml = idx + 1;
        let dateText = '待定';

        if (stage.status === 'completed') {
            statusClass = 'completed';
            iconHtml = '<i class="fas fa-check"></i>';
            dateText = '已完成';
        } else if (stage.status === 'current') {
            statusClass = 'current';
            iconHtml = '<i class="fas fa-play" style="font-size:12px"></i>';
            dateText = '进行中';
        }

        // 注意：这里 onclick 调用时不再传递 idx，而是用 dataset 或者直接闭包
        // 为了简单，我们修改 showStageDetail 支持直接读取全局数据
        html += `
            <div class="step-node ${statusClass}" onclick="showStageDetail(${idx})">
                <div class="step-icon">${iconHtml}</div>
                <div class="step-name">${stage.name}</div>
                <div class="step-date-tag">${dateText}</div>
            </div>
        `;
    });
    container.innerHTML = html;
}

function showStageDetail(idx) {
    if (!globalStageData || !globalStageData[idx]) return;
    
    const stage = globalStageData[idx];
    const metricsContainer = document.getElementById('detailMetrics');
    const listContainer = document.getElementById('detailTaskList');
    const panel = document.getElementById('stageDetailPanel');
    
    // 更新选中样式
    document.querySelectorAll('.step-node').forEach((el, i) => {
        if(i === idx) el.classList.add('current');
        else if(globalStageData[i].status !== 'current') el.classList.remove('current');
    });

    const metricsMap = [
        { key: 'duration', label: '阶段工期', icon: 'fa-clock', color: '#1664FF' },
        { key: 'docs_count', label: '产出文档', icon: 'fa-file-alt', color: '#722ED1' },
        { key: 'approval_rate', label: '审批通过率', icon: 'fa-check-double', color: '#00B42A' },
        { key: 'risk_count', label: '关联风险', icon: 'fa-exclamation-triangle', color: '#FF7D00' }
    ];
    
    if (metricsContainer) {
        metricsContainer.innerHTML = metricsMap.map(cfg => `
            <div class="metric-box">
                <i class="fas ${cfg.icon} m-icon" style="color:${cfg.color}"></i>
                <div class="m-val" style="color:${cfg.color}">${stage.metrics[cfg.key] || '--'}</div>
                <div class="m-lbl">${cfg.label}</div>
            </div>
        `).join('');
    }

    if (listContainer) {
        if(stage.sub_tasks && stage.sub_tasks.length) {
            listContainer.innerHTML = stage.sub_tasks.map(t => {
                let badgeClass = 'pending';
                let badgeText = '未开始';
                if(t.status === 'done') { badgeClass = 'done'; badgeText = '已完成'; }
                if(t.status === 'delay') { badgeClass = 'delay'; badgeText = '已延期'; }
                if(t.status === 'pending' && stage.status === 'current') { badgeText = '进行中'; } 
                
                return `
                    <div class="task-item">
                        <div class="task-left">
                            <i class="fas fa-circle" style="font-size:6px; color:#C9CDD4"></i>
                            <span>${t.name}</span>
                        </div>
                        <span class="status-badge ${badgeClass}">${badgeText}</span>
                    </div>
                `;
            }).join('');
        } else {
            listContainer.innerHTML = '<div style="text-align:center;color:#999;padding:20px">暂无数据</div>';
        }
    }

    if(panel) panel.style.display = 'block';
}

// =========================================
// 5. Milestones Logic
// =========================================
function renderMilestones(data) {
    const container = document.getElementById('milestoneGrid');
    if(!container || !data.milestones) return;

    const iconMap = {
        "需求确认": "fa-clipboard-check",
        "需求确认里程碑": "fa-clipboard-check",
        "中期阶段汇报": "fa-chart-pie",
        "用户测试(UAT)": "fa-users-cog",
        "竣工验收": "fa-award"
    };

    container.innerHTML = data.milestones.map(m => {
        let statusClass = 'pending';
        let statusText = '待开始';
        
        if(m.status === 'completed') { statusClass = 'done'; statusText = '已完成'; }
        else if(m.status === 'delay') { statusClass = 'delay'; statusText = '已延期'; }

        const iconClass = iconMap[m.name] || 'fa-flag';

        return `
            <div class="milestone-card ${statusClass}">
                <div class="ms-header-row">
                    <div class="ms-icon-box">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <span class="ms-status-text">${statusText}</span>
                </div>
                
                <div class="ms-title-large">${m.name}</div>
                
                <div class="ms-info-row">
                    <span class="ms-label">计划完成</span>
                    <span class="ms-val">${m.plan_date}</span>
                </div>
                <div class="ms-info-row">
                    <span class="ms-label">实际完成</span>
                    <span class="ms-val">${m.actual_date || '--'}</span>
                </div>
                
                ${m.status === 'delay' ? 
                    `<div class="delay-tag-block">
                        <i class="fas fa-exclamation-triangle"></i> 严重延期 ${m.delay_days} 天
                     </div>` : ''}
            </div>
        `;
    }).join('');
}